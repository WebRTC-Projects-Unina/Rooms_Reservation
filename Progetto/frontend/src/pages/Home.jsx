import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api";
import { useAuth } from "../context/AuthContext";
import "../style/Home.css";

export default function Home() {
    const nav = useNavigate();
    const { user } = useAuth();

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // helper per ottenere la stringa "YYYY-MM-DDTHH:MM" dell'ora locale
    const getLocalISOString = (date) => {
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().slice(0, 16);
    };

    // al caricamento, cerca le aule disponibili in questo momento
    useEffect(() => {
        async function fetchNow() {
            setLoading(true);
            try {
                const now = new Date();
                const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);  // +1 ora

                const startStr = getLocalISOString(now);
                const endStr = getLocalISOString(oneHourLater);

                const res = await apiGet(
                    `/api/aule-disponibili?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`
                );

                const fetchedRooms = res.rooms || [];
                // ordina per ID
                fetchedRooms.sort((a, b) => a.id - b.id);
                setRooms(fetchedRooms);

            } catch (err) {
                console.error("Errore home fetch:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchNow();

        // timer per aggiornare l'orologio visualizzato ogni minuto
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // gestione click su "Prenota Subito"
    const handleQuickBook = (roomId) => {
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        nav("/create-booking", {
            state: {
                preSelectedRoom: roomId,
                preSelectedStart: getLocalISOString(now),
                preSelectedEnd: getLocalISOString(oneHourLater)
            }
        });
    };

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

    return (
        <div className="home-page">
            
            {/* HERO SECTION */}
            <div className="home-hero">
                <h1 className="hero-title">
                    {user ? `Ciao, ${user.username}!` : "Benvenuto in SpaceHub 💬"}
                </h1>
                <p className="hero-subtitle">
                    Trova e prenota la tua aula ideale in pochi secondi
                </p>
            </div>

            <div className="home-container">
                
                {/* QUICK ACTIONS */}
                <div className="actions-grid">
                    <div className="action-card" onClick={() => nav("/rooms")}>
                        <span className="action-icon">🔍</span>
                        <h3 className="action-title">Cerca Aule</h3>
                        <p className="action-desc">Filtra per data e orario specifico</p>
                    </div>

                    <div className="action-card" onClick={() => nav(user ? "/my-bookings" : "/login")}>
                        <span className="action-icon">📅</span>
                        <h3 className="action-title">Le mie Prenotazioni</h3>
                        <p className="action-desc">Gestisci le tue prenotazioni e avvia la riunione</p>
                    </div>
                </div>

                {/* LIVE AVAILABILITY */}
                <h2 className="section-title">
                    <span className="live-indicator"></span>
                    Libere adesso ({currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
                </h2>

                {loading ? (
                    <p className="loading-text">Caricamento disponibilità in tempo reale...</p>
                ) : (
                    <>
                        {rooms.length === 0 ? (
                            <p className="loading-text">Nessuna aula libera in questo momento. Prova a cercare per un altro orario.</p>
                        ) : (
                            <div className="home-rooms-grid">
                                {rooms.map((r, index) => (
                                    <div key={r.id} className="home-room-card">
                                        <div className="h-room-header" style={{ background: getCardGradient(index) }}>
                                            <span>ID: {r.id}</span>
                                            {r.available && <span>✔</span>}
                                        </div>
                                        <div className="h-room-body">
                                            <h4 className="h-room-name">{r.name}</h4>
                                            <span className="h-room-info">📍 {r.location}</span>
                                            <span className="h-room-info">👥 Cap: {r.capacity}</span>
                                            
                                            {r.available && (
                                                <button 
                                                    className="h-room-btn"
                                                    onClick={() => handleQuickBook(r.id)}
                                                >
                                                    Prenota per 1 ora
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}