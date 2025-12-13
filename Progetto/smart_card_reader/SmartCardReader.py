from smartcard.System import readers
from smartcard.util import toHexString

class SmartCardReader:
    # manages connection and read/write operations on a ACR122U smart card reader.

    def __init__(self, key_a, key_slot, reader_index=0):
        """
        initializes the reader, connects, and loads the key.
        :param key_a: authentication key A (list of bytes/int).
        :param key_slot: reader memory slot to load the key into.
        :param reader_index: index of the reader to use (defaults to the first).
        """
        self.key_a = key_a
        self.key_slot = key_slot
        self.connection = None
        self.reader = None
        
        self._connect(reader_index)
        self.load_key()

    def _connect(self, reader_index):
        """finds a reader, creates, and establishes the connection."""
        r = readers()
        if not r:
            raise Exception("[ERROR] no reader found!")
        
        if reader_index >= len(r):
            raise IndexError(f"[ERROR] specified reader index ({reader_index}) is unavailable.")
        
        self.reader = r[reader_index]
        print(f"[INFO] using reader: {self.reader}")

        try:
            self.connection = self.reader.createConnection()
            self.connection.connect()
            self._get_uid()
        except Exception as e:
            raise Exception(f"[ERROR] error connecting to reader: {e}")

    def _get_uid(self):
        """reads the card's UID."""
        GET_UID = [0xFF, 0xCA, 0x00, 0x00, 0x00]
        uid, sw1, sw2 = self.connection.transmit(GET_UID)

        if sw1 == 0x90 and sw2 == 0x00:
            print("[INFO] card UID:", toHexString(uid))
        else:
            print("[WARNING] could not read card UID.")

    def disconnect(self):
        """closes the connection with the reader."""
        if self.connection:
            try:
                self.connection.disconnect()
                print("\n[INFO] disconnection completed.")
            except Exception as e:
                print(f"[ERROR] error during disconnection: {e}")
            finally:
                self.connection = None

    # context management methods (for use with 'with')
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()

    # --- APDU Operations ---

    def load_key(self):
        """loads the key into the specified reader slot."""
        # FF 82 00 P2 Lc Data
        apdu = [0xFF, 0x82, 0x00, self.key_slot, 0x06] + self.key_a
        _, sw1, sw2 = self.connection.transmit(apdu)
        
        status_ok = (sw1 == 0x90 and sw2 == 0x00)
        
        print(f"\n[INFO] loading key ({toHexString(self.key_a)}) into slot {self.key_slot}...")
        if status_ok:
            print("[STATUS] key loading completed.")
        else:
            # ACR122U sometimes keeps the key in memory, so we proceed anyway.
            print("[ERROR] key loading failed! (proceeding anyway)")
        
        return status_ok

    def authenticate(self, block, key_type=0x60):
        """authenticates a block with the key loaded in the slot."""
        # FF 86 00 00 05 [01 00 BLOCK_NUM KEY_TYPE KEY_SLOT]
        apdu = [
            0xFF, 0x86, 0x00, 0x00, 0x05,
            0x01, 0x00, block, key_type, self.key_slot
        ]
        _, sw1, sw2 = self.connection.transmit(apdu)
        
        status_ok = (sw1 == 0x90 and sw2 == 0x00)
        print(f"authentication block {block} | status: {hex(sw1)}{hex(sw2).lstrip('0x').zfill(2).upper()}")
        return status_ok

    def read_block(self, block):
        """reads a 16-byte block after authentication."""
        if not self.authenticate(block):
            print(f"[ERROR] reading block {block} failed: authentication failed.")
            return None
            
        apdu = [0xFF, 0xB0, 0x00, block, 16]
        data, sw1, sw2 = self.connection.transmit(apdu)

        if sw1 == 0x90 and sw2 == 0x00:
            return bytes(data)
        else:
            print(f"[ERROR] reading block {block} failed. status: {hex(sw1)}{hex(sw2).lstrip('0x').zfill(2).upper()}")
            return None

    def write_block(self, block, data16):
        """writes 16 bytes to a block after authentication."""
        if len(data16) != 16:
            raise ValueError("[ERROR] the block must be exactly 16 bytes!")

        if not self.authenticate(block):
            print(f"[ERROR] writing block {block} failed: authentication failed.")
            return False

        apdu = [0xFF, 0xD6, 0x00, block, 16] + list(data16)
        _, sw1, sw2 = self.connection.transmit(apdu)
        
        status_ok = (sw1 == 0x90 and sw2 == 0x00)
        
        if status_ok:
            print(f"[STATUS] writing block {block} completed.")
        else:
            print(f"[ERROR] writing block {block} failed. status: {hex(sw1)}{hex(sw2).lstrip('0x').zfill(2).upper()}")

        return status_ok
    
    def signal_success(self):
        """green led and short beep (ok)."""
        if not self.connection:
            return
        
        apdu = [0xFF, 0x00, 0x40, 0x00, 0x04, 0x02, 0x00, 0x01, 0x01]
        
        try:
            self.connection.transmit(apdu)
        except Exception as e:
            print(f"[WARNING] failed to control led/buzzer: {e}")

    def signal_error(self):
        """red led and long beep (error)."""
        if not self.connection:
            return
        
        apdu = [0xFF, 0x00, 0x40, 0x00, 0x04, 0x01, 0x00, 0x01, 0x01]
        
        try:
            self.connection.transmit(apdu)
        except Exception as e:
            print(f"[WARNING] failed to control led/buzzer: {e}")