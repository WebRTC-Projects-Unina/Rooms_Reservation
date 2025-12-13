import time
import requests
import os
import urllib3
from dotenv import load_dotenv
from crypto_utils_reader import *
from SmartCardReader import SmartCardReader
from smartcard.System import readers
from smartcard.CardType import AnyCardType
from smartcard.CardRequest import CardRequest
from smartcard.Exceptions import CardRequestTimeoutException

# --- ENV CONFIG ---
current_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(current_dir, '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

BACKEND_URL = os.getenv("BACKEND_URL", "https://localhost:3000/api/controlla-accesso")
READER_UID = os.getenv("READER_UID", "READER001")
READER_PRIVATE_KEY_PATH = os.getenv("READER_PRIVATE_KEY", "./keys/reader_private.pem")
SERVER_PUBLIC_KEY_PATH = os.getenv("SERVER_PUBLIC_KEY", "./keys/server_public.pem")

# --- SMART CARD READER CONFIG ---
KEY_A = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
KEY_SLOT = 0
DATA_BLOCK = 4 

# --- MAIN LOGIC ---
def main_loop():
    print(f"--- READER SERVICE STARTED ({READER_UID}) ---")
    print(f"target backend: {BACKEND_URL}")
    print("\n-----------------------------------------------")
    
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    try:
        reader_private_key = load_reader_private_key(READER_PRIVATE_KEY_PATH)
        server_public_key = load_server_public_key(SERVER_PUBLIC_KEY_PATH)
    except Exception as e:
        print(f"[CRITICAL] failed to load keys: {e}")
        return

    card_type = AnyCardType()
    
    while True:
        try:
            # --- 1. WAIT FOR CARD
            print("\n[INFO] waiting for card...")
            try:
                CardRequest(timeout=None, cardType=card_type).waitforcard()
            except CardRequestTimeoutException:
                continue 
            except Exception as e:
                time.sleep(1)
                continue

            # --- 2. CARD FOUND, ELABORATE DATA
            try:
                with SmartCardReader(key_a=KEY_A, key_slot=KEY_SLOT) as reader:
                    
                    raw_data = reader.read_block(DATA_BLOCK)
                    
                    if raw_data:
                        card_id_str = raw_data.rstrip(b'\x00').decode(errors='ignore')
                        print(f"[DETECTED] card uid: {card_id_str}")
                        
                        payload = {"card_uid": card_id_str, "reader_uid": READER_UID}
                        signature = sign_payload(reader_private_key, payload)
                        full_body = {"card_uid": card_id_str, "reader_uid": READER_UID, "signature": signature}
                        
                        print("[NETWORK] sending request to backend...")
                        try:
                            res = requests.post(BACKEND_URL, json=full_body, timeout=2, verify=False)
                            
                            if res.status_code in [200, 401, 403]:
                                response_data = res.json()
                                if verify_server_response(server_public_key, response_data):
                                    if response_data.get('access') is True:
                                        print(f"✅ [ACCESS GRANTED] {response_data.get('message')}")
                                        reader.signal_success()
                                    else:
                                        print(f"⛔ [ACCESS DENIED] {response_data.get('message')}")
                                        reader.signal_error()
                                else:
                                    print("⚠️ [SECURITY FAIL] invalid server signature")
                                    reader.signal_error()
                            else:
                                print(f"⚠️ [HTTP ERROR] {res.status_code}")
                                reader.signal_error()
                        except requests.exceptions.ConnectionError:
                            print("[ERROR] backend offline")
                            reader.signal_error()
                        except Exception as e:
                            print(f"[ERROR] request failed: {e}")
                            reader.signal_error()
                    else:
                        print("[WARNING] could not read block (auth failed or empty)")
                        reader.signal_error()

            except Exception as e:
                print(f"[ERROR] reader/card error: {e}")
            
            # --- 3. WAIT FOR CARD TO BE REMOVED
            print(">> please remove the card to continue... <<")
            
            while True:
                try:
                    r_list = readers()
                    if not r_list:
                        break   # if no reader found, break
                    
                    target_reader = r_list[0]
                    
                    # try to create connection
                    connection = target_reader.createConnection()
                    connection.connect()
                    # is connection is estabilished, card is still on the reader -> disconnect and try again
                    connection.disconnect()
                    time.sleep(1)
                    
                except Exception:
                    # if code goes in exception, the card has been removed
                    print("[INFO] card removed.")
                    print("\n-----------------------------------------------")
                    break
            
            time.sleep(1)

        except KeyboardInterrupt:
            print("\n-----------------------------------------------")
            print(f"--- READER SERVICE ENDED ({READER_UID}) ---")
            break

if __name__ == "__main__":
    main_loop()
