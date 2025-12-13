import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";       // hook per reindirizzare l'utente ad un altra pagina dopo il login
import "../style/Auth.css";

export default function Login() {
    // inizializzazione degli stati
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    
    const [error, setError] = useState(""); 
    
    const navigate = useNavigate();

    // funzione che gestisce ciò che accade quando si preme il pulsante "Accedi"
    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        const res = await login(username, password);
        
        if (res.error) {
            setError(res.error);
        } else {
            // reindirizzata alla home
            navigate("/");
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                
                <h2 className="auth-title">Benvenuto 👋</h2>
                
                <form onSubmit={handleSubmit} className="auth-form">
                    
                    {/* input username */}
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input 
                            id="username"
                            className="auth-input"
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            placeholder="Inserisci il tuo username" 
                            required
                        />
                    </div>
                    
                    {/* campo password */}
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input 
                            id="password"
                            type="password" 
                            className="auth-input"
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="Inserisci la tua password" 
                            required
                        />
                    </div>
                    
                    <button type="submit" className="auth-button">Accedi</button>

                    {/* messaggio errore */}
                    {error && (
                        <div className="auth-error">
                            ⚠️ {error}
                        </div>
                    )}
                </form>

                {/* footer con link alla registrazione */}
                <div className="auth-footer">
                    Non hai un account? <Link to="/register" className="auth-link">Registrati qui</Link>
                </div>

            </div>
        </div>
    );
}