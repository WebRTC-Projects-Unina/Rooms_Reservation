import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiPost } from "../api";
import "../style/CreateBooking.css";

export default function CreateBooking() {
  const nav = useNavigate();
  const location = useLocation();   // hook per leggere i dati passati eventualmente da Rooms.jsx (state)

  const { preSelectedRoom, preSelectedStart, preSelectedEnd } = location.state || {};
  // usa i dati precompilati come valori iniziali, altrimenti stringhe vuote
  const [roomId, setRoomId] = useState(preSelectedRoom || "");
  const [startTime, setStartTime] = useState(preSelectedStart || "");
  const [endTime, setEndTime] = useState(preSelectedEnd || "");

  const [errorMsg, setErrorMsg] = useState("");         // messaggio rosso (errore)
  const [successMsg, setSuccessMsg] = useState("");     // messaggio verde (successo)

  // funzione che gestisce l'invio dei dati del form al backend 
  const handleCreate = async (e) => {
    e.preventDefault();

    // reset messaggi precedenti
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const data = await apiPost("/api/crea-prenotazione", { roomId, startTime, endTime });

      if (data.error) {
        setErrorMsg(data.error || "Errore sconosciuto");
        return;
      }

      // successo
      setSuccessMsg("Prenotazione creata con successo! Reindirizzamento...");
      // attesa di 2 secondi e reindirizzamento
      setTimeout(() => {
        nav("/my-bookings"); 
      }, 2000);

    } catch (err) {
      console.error(err);
      setErrorMsg("Errore di connessione al server.");
    }
  };

  return (
    <div className="create-page">
      <div className="create-card">
        
        <h2 className="form-title">
            Prenota <span>Spazio</span>
        </h2>

        <form onSubmit={handleCreate} className="booking-form">
          
          <div className="form-group">
            <label>ID Stanza</label>
            <input
                className="form-input"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
                placeholder="Es. 101"
                // se preSelectedRoom esiste, blocchiamo la modifica per comodità
                readOnly={!!preSelectedRoom} 
            />
          </div>

          <div className="form-group">
            <label>Inizio</label>
            <input
                type="datetime-local"
                className="form-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
            />
          </div>

          <div className="form-group">
            <label>Fine</label>
            <input
                type="datetime-local"
                className="form-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={!!successMsg}>
            {successMsg ? "Attendi..." : "Conferma Prenotazione"}
          </button>
        </form>

        {/* box messaggi */}
        {errorMsg && (
            <div className="msg-box error">
                ⚠️ {errorMsg}
            </div>
        )}

        {successMsg && (
            <div className="msg-box success">
                ✅ {successMsg}
            </div>
        )}

      </div>
    </div>
  );
}