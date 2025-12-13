import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPut } from "../api";
import "../style/CreateBooking.css";

export default function EditBooking() {
  const { id } = useParams();
  const nav = useNavigate();

  const [booking, setBooking] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [errorMsg, setErrorMsg] = useState("");         // messaggio rosso (errore)
  const [successMsg, setSuccessMsg] = useState("");     // messaggio verde (successo)
   
  // carica i dati della prenotazione originale
  // nota teorica: useEffect() è un hook che serve a dire a react: 
  // "appena hai finito di renderizzare la pagina, esegui questo codice automaticamentente".
  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiGet(`/api/prenotazioni/${id}`);
        const data = res.booking || res; 

        if (data) {
          setBooking(data);
          
          // conversione formato data per compatibilità con backend
          if (data.start_time) {
             setStartTime(data.start_time.substring(0, 16).replace(' ', 'T'));
          }
          if (data.end_time) {
             setEndTime(data.end_time.substring(0, 16).replace(' ', 'T'));
          }
        }
      } catch (err) {
        console.error("Errore caricamento:", err);
        setErrorMsg("Impossibile caricare la prenotazione.");
      }
    }
    loadData();
  }, [id]);   // si riattiva se cambia l'id

  // funzione che gestisce l'invio delle modifiche backend 
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // reset messaggi precedenti
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const data = await apiPut(`/api/prenotazioni/${id}`, { startTime, endTime });
  
      if (data.error) {
        setErrorMsg(data.error || "Errore sconosciuto");
        return;
      }
  
      // successo
      setSuccessMsg("Modifica salvata con successo! Reindirizzamento...");
      // attesa di 2 secondi e reindirizzamento
      setTimeout(() => {
        nav("/my-bookings"); 
      }, 2000);

    } catch (err) {
      console.error(err);
      setErrorMsg("Errore di connessione al server.");
    }
  };

  // mostra un messaggio di caricamento finché lo stato booking non viene popolat
  if (!booking && !errorMsg) {
      return (
        <div className="create-page">
            <p style={{color: "#666", fontSize: "1.2rem"}}>Caricamento in corso...</p>
        </div>
      );
  }

  return (
    <div className="create-page">
      <div className="create-card">
        
        <h2 className="form-title">
            Modifica <span>Prenotazione #{id}</span>
        </h2>

        <form onSubmit={handleUpdate} className="booking-form">
          
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

          <div className="btn-container">
            <button type="submit" className="submit-btn" disabled={!!successMsg}>
                {successMsg ? "Salvato!" : "Salva modifiche"}
            </button>
            
            <button 
                type="button" 
                onClick={() => nav("/my-bookings")} 
                className="btn-secondary"
                disabled={!!successMsg}
            >
                Annulla
            </button>
          </div>

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