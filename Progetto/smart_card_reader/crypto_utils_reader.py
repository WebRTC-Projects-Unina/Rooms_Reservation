import base64
import json
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization

def load_reader_private_key(reader_private_key_path):
    """load RSA reader private key from PEM file."""
    try:
        with open(reader_private_key_path, "rb") as key_file:
            return serialization.load_pem_private_key(key_file.read(), password=None)
    except FileNotFoundError:
        print(f"[FATAL] reder private key not found in: {reader_private_key_path}")
        exit(1)

def load_server_public_key(server_public_key_path):
    """load RSA server public key from PEM file (to verify server responses)."""
    try:
        with open(server_public_key_path, "rb") as key_file:
            return serialization.load_pem_public_key(key_file.read())
    except FileNotFoundError:
        print(f"[FATAL] server public key not found at: {server_public_key_path}")
        exit(1)

def sign_payload(private_key, data_dict):
    """sign data using RSA-SHA256."""
    # 1. JSON format (for backend compatibility)
    # node.js uses no spaces in separators (',', ':')
    # python uses spaces in separators (', ', ': ')
    canonical_json = json.dumps(data_dict, sort_keys=True, separators=(',', ':'))
    
    # 2. sign
    signature = private_key.sign(
        canonical_json.encode('utf-8'),
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    
    # 3. return in base64
    return base64.b64encode(signature).decode('utf-8')

def verify_server_response(server_public_key, response_json):
    """verify the signature using server's public key."""
    try:
        # 1. extract sign
        signature_b64 = response_json.get('signature')
        if not signature_b64:
            print("[SECURITY WARNING] server response has no signed data")
            return False

        # 2. separate data from signature
        data_to_verify = response_json.copy()
        del data_to_verify['signature']

        # 3. JSON format (for backend compatibility)
        # node.js uses no spaces in separators (',', ':')
        # python uses spaces in separators (', ', ': ')
        canonical_json = json.dumps(data_to_verify, sort_keys=True, separators=(',', ':'))

        # 4. verify
        server_public_key.verify(
            base64.b64decode(signature_b64),
            canonical_json.encode('utf-8'),
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        return True

    except Exception as e:
        print(f"[SECURITY ALERT] server signature verification failed: {e}")
        return False