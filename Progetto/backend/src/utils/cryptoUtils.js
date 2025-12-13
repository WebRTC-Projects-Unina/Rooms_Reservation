import crypto from 'crypto';

// helper to sort object data
function sortObjectKeys(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }
    return Object.keys(obj).sort().reduce((result, key) => {
        result[key] = sortObjectKeys(obj[key]);
        return result;
    }, {});
}

// canonizza i dati per garantire che la stringa firmata sia identica tra JS e Python.
function getCanonicalString(data) {
    const sortedData = sortObjectKeys(data);
    return JSON.stringify(sortedData); // nessuno spazio tra i separatori
}

// verify digital signature using reader public key
export function verifySignature(data, signature, publicKey) {
    try {
        // 1. usa la stessa canonizzazione usata per la firma
        const canonicalString = getCanonicalString(data);

        // 2. crea l'oggetto 'Verifier'
        const verifier = crypto.createVerify('RSA-SHA256');
        
        // 3. carica la stringa canonica (non l'hash!)
        // il modulo crypto calcola automaticamente l'hash SHA256 internamente.
        verifier.update(canonicalString);

        // 4. verifica
        const isValid = verifier.verify(publicKey, signature, 'base64');
        return isValid;

    } catch (error) {
        console.error("Errore durante la verifica della firma:", error);
        return false;
    }
}

// sign data using server private key
export function signData(data, privateKeyPem) {
    try {
        // 1. usa la stessa canonizzazione usata per la firma
        const canonicalString = getCanonicalString(data);

        // 2. crea l'oggetto 'Sign'
        const signer = crypto.createSign('RSA-SHA256');
        
        // 3. carica la stringa canonica
        signer.update(canonicalString);
        signer.end();

        // 4. firma e codifica in Base64
        const signature = signer.sign(privateKeyPem, 'base64');
        return signature;

    } catch (error) {
        console.error("Errore durante la generazione della firma:", error);
        throw error;
    }
}