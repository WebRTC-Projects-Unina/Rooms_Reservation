import { bookingModel } from "../models/bookingModel.js";

// --- CONFIGURAZIONE DOTENV
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '..', '.env') });

// --- CONFIGURAZIONE JANUS
const JANUS_URL = process.env.JANUS_URL || 'https://localhost:8089/janus';
const JANUS_SECRET = process.env.JANUS_SECRET || 'SECRET_KEY';

// --- CREA UNA STANZA SUL SERVER JANUS PER LA RIUNIONE
export const startMeeting = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const userId = req.session.userId;

        // 1. controllo di sicurezza
        const booking = await bookingModel.getBookingById(bookingId);

        if (!booking) {
            return res.status(404).json({ error: "Prenotazione non trovata" });
        }

        if (booking.user_id !== userId) {
            return res.status(403).json({ error: "Non sei autorizzato ad avviare questa lezione" });
        }

        // per generare ID transazione casuale
        const transactionId = () => Math.random().toString(36).substring(2, 15);

        // 2. creazione sessione su Janus
        const sessionRes = await fetch(JANUS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                janus: "create",
                transaction: transactionId(),
                apisecret: JANUS_SECRET
            })
        });
        // sessione :)
        
        const sessionData = await sessionRes.json();
        if (sessionData.janus !== "success") {
            throw new Error("Impossibile creare sessione Janus: " + JSON.stringify(sessionData));
        }
        const sessionId = sessionData.data.id;

        // 3. attach al plugin VideoRoom
        const attachRes = await fetch(`${JANUS_URL}/${sessionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                janus: "attach",
                plugin: "janus.plugin.videoroom",
                transaction: transactionId(),
                apisecret: JANUS_SECRET
            })
        });

        const attachData = await attachRes.json();
        if (attachData.janus !== "success") {
            throw new Error("Impossibile attaccare plugin: " + JSON.stringify(attachData));
        }
        const handleId = attachData.data.id;

        // 4. creazione della stanza
        const createRes = await fetch(`${JANUS_URL}/${sessionId}/${handleId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                janus: "message",
                transaction: transactionId(),
                apisecret: JANUS_SECRET,
                body: {
                    request: "create",
                    admin_key: JANUS_SECRET,    // chiave per autorizzare la creazione nel plugin
                    room: bookingId,       
                    permanent: false,           // la stanza viene distrutta se Janus si riavvia
                    description: `Riunione #${bookingId}`,
                    publishers: 6,         
                    is_private: false      
                }
            })
        });

        const createData = await createRes.json();
        const pluginData = createData.plugindata?.data;

        // 5. verifica risultato e risposta al client        
        if (pluginData && (pluginData.videoroom === "created" || pluginData.error_code === 427)) {  // error_code = 427 significa che la stanza esiste già
            res.json({ 
                success: true, 
                message: "Stanza pronta sul server video",
                roomId: bookingId 
            });

            // invio una richiesta 'destroy' a Janus per chiudere la sessione
            try {
                await fetch(`${JANUS_URL}/${sessionId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        janus: "destroy",
                        transaction: transactionId(),
                        apisecret: JANUS_SECRET
                    })
                });
            } catch (cleanupErr) {
                console.warn("Warning: Impossibile distruggere la sessione Janus", cleanupErr);
            }
            
        } else {
            console.error("Risposta Janus inattesa:", createData);
            
            // tentativo di pulizia anche in caso di fallimento logico
            try {
                await fetch(`${JANUS_URL}/${sessionId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        janus: "destroy",
                        transaction: transactionId(),
                        apisecret: JANUS_SECRET
                    })
                });
            } catch (e) { /* ignore */ }

            res.status(500).json({ error: "Errore nella creazione della stanza video" });
        }

    } catch (err) {
        console.error("Errore in startMeeting:", err);
        res.status(500).json({ error: "Errore interno durante l'avvio della lezione" });
    }
};