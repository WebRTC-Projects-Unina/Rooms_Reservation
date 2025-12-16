import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiDelete } from "../api";
import "../style/MyBookings.css";
import VideoClassroom from "../components/VideoClassroom";

// funzione per generare il link della riunione
function generateHostLink(id) {
    return `${window.location.origin}/live/room/${id}`;
}

// funzione che controlla se la prenotazione è attiva ORA
function isBookingActive(start, end) {
    const now = new Date();
    return now >= new Date(start) && now <= new Date(end);
}

export default function MyBookings() {
    const [list, setList] = useState([]);
    const [streamingId, setStreamingId] = useState(null); // id della prenotazione che sta trasmettendo
    // messaggi di feedback (verdi -> successo / rosso -> fallimento)
    const [feedback, setFeedback] = useState({ msg: "", type: "" });

    // funzione per prelevare tutte le prenotazioni dell'utente
    async function load() {
        try {
            const res = await apiGet("/api/prenotazioni");
            // le prenotazioni sono ordinate dalla più recente alla più vecchia
            const bookings = res.bookings || [];
            bookings.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
            setList(bookings);
        } catch (err) {
            console.error(err);
            setList([]); // in caso di errore, reset della lista
        }
    }

    async function del(id) {
        if (!confirm("Sei sicuro di voler eliminare questa prenotazione?")) return;

        try {
            const res = await apiDelete(`/api/prenotazioni/${id}`);
            if (res.error) {
                setFeedback({ msg: res.error, type: "error" });
            } else {
                load();
                setFeedback({ msg: "Prenotazione eliminata con successo!", type: "success" });
                // rimuovi messaggio dopo 3 secondi
                setTimeout(() => setFeedback({ msg: "", type: "" }), 3000);
            }
        } catch (err) {
            console.error(err);
            setFeedback({ msg: "Errore durante l'eliminazione.", type: "error" });
        }
    }

    useEffect(() => { load(); }, []);

    // helper per cambiare i colori alle prenotazioni
    const getCardGradient = (index) => {
        const gradients = [
            "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
            "linear-gradient(135deg, #9baee7 0%, #83b5fe 100%)",
            "linear-gradient(135deg, #a18cd1 0%, #a1c4fd 100%)",
            "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)"
        ];
        return gradients[index % gradients.length];
    };

    // helper per formattare la data per il frontend
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bookings-page">
            <div className="bookings-banner">
                <h1>📅 Le mie Prenotazioni</h1>
            </div>

            <div className="bookings-container">

                {/* feedback Message */}
                {feedback.msg && (
                    <div className={`feedback-msg ${feedback.type}`}>
                        {feedback.msg}
                    </div>
                )}

                {list.length === 0 && !feedback.msg && (
                    <div className="no-bookings">
                        <p>Non hai ancora effettuato prenotazioni.</p>
                        <Link to="/rooms" style={{ color: "#a18cd1", fontWeight: "bold" }}>
                            Prenota un'aula ora
                        </Link>
                    </div>
                )}

                <div className="bookings-grid">
                    {list.map((b, index) => {

                        const active = isBookingActive(b.start_time, b.end_time);
                        // controllo check-in
                        const hasCheckedIn = !!b.check_in; 

                        return (
                            <div key={b.id} className="booking-card">

                                {/* header Colorato */}
                                <div className="booking-header" style={{ background: getCardGradient(index) }}>
                                    <div>
                                        <h3 className="booking-room-title">Aula {b.room_id}</h3>
                                    </div>
                                    <span className="booking-id">#{b.id}</span>
                                </div>

                                {/* body con dettagli sulla prenotazione */}
                                <div className="booking-body">

                                    {/* se stream è attiva, mostra il video */}
                                    {streamingId === b.id ? (
                                        <div className="streaming-active-area" style={{ marginBottom: "15px" }}>
                                            {/* host */}
                                            <VideoClassroom role="host" roomId={b.id} initialCheckIn={true} />
                                            <button
                                                onClick={() => setStreamingId(null)}
                                                className="btn-action"
                                                style={{ marginTop: "10px", backgroundColor: "#e74c3c", color: "white", width: "100%" }}
                                            >
                                                ⏹ Termina Lezione
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="info-row">
                                                <span className="icon">🗓️</span>
                                                <span>{formatDate(b.start_time)}</span>
                                            </div>

                                            <div className="info-row">
                                                <span className="icon">🕒</span>
                                                <span>
                                                    {formatTime(b.start_time)} ➔ {formatTime(b.end_time)}
                                                </span>
                                            </div>

                                            {/* bottone per avviare lo streaming (solo se attiva in questo momento) */}
                                            <div style={{ marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "10px" }}>

                                                {/* csao 1: riunione non attiva per orario */}
                                                {!active && (
                                                    <button
                                                        className="btn-action"
                                                        disabled
                                                        style={{
                                                            backgroundColor: "#7f8c8d",
                                                            color: "white",
                                                            width: "100%"
                                                        }}
                                                    >
                                                        ⛔ Riunione non attiva
                                                    </button>
                                                )}

                                                {/* caso 2: riunione attiva ma check-in mancante */}
                                                {active && !hasCheckedIn && (
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ 
                                                            color: '#e74c3c', 
                                                            fontWeight: 'bold', 
                                                            fontSize: '0.9em', 
                                                            marginBottom: '5px',
                                                            border: '1px solid #e74c3c',
                                                            padding: '5px',
                                                            borderRadius: '5px',
                                                            backgroundColor: '#fff5f5'
                                                        }}>
                                                            ⛔ Accesso fisico non rilevato.<br/>Entra in aula per avviare la riunione.
                                                        </div>
                                                        {/* bottone "Ricarica stato" opzionale, per evitare refresh intera pagina */}
                                                        <button 
                                                            onClick={load} 
                                                            style={{ fontSize: '0.8em', textDecoration: 'underline', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
                                                        >
                                                            🔄 Aggiorna stato
                                                        </button>
                                                    </div>
                                                )}

                                                {/* caso 3: riunione attiva e check-in fatto */}
                                                {active && hasCheckedIn && (
                                                    <button
                                                        onClick={() => {
                                                            setStreamingId(b.id);
                                                            const link = generateHostLink(b.id);
                                                            navigator.clipboard.writeText(link);
                                                            alert("Link per accedere alla riunione (copiato negli appunti): " + link);
                                                        }}
                                                        className="btn-action"
                                                        style={{
                                                            backgroundColor: "#2ecc71",
                                                            color: "white",
                                                            width: "100%"
                                                        }}
                                                    >
                                                        🎥 Avvia Riunione
                                                    </button>
                                                )}

                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* azioni (modifica, elimina) - nascondiamo se in streaming */}
                                {streamingId !== b.id && (
                                    <div className="booking-actions">
                                        <Link to={`/edit-booking/${b.id}`} className="btn-action btn-edit">
                                            ✏️ Modifica
                                        </Link>
                                        <button onClick={() => del(b.id)} className="btn-action btn-delete">
                                            🗑️ Elimina
                                        </button>
                                    </div>
                                )}

                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}