import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../style/Auth.css";

export default function Register() {
    const { register } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    
    const [error, setError] = useState("");
    
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        
        setError("");

        const res = await register(username, password);
        
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
                
                <h2 className="auth-title">Crea Account ✨</h2>
                
                <form onSubmit={handleSubmit} className="auth-form">
                    
                    {/* input username */}
                    <div className="input-group">
                        <label htmlFor="reg-username">Username</label>
                        <input 
                            id="reg-username"
                            className="auth-input"
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            placeholder="Scegli un username" 
                            required
                        />
                    </div>
                    
                    {/* input password */}
                    <div className="input-group">
                        <label htmlFor="reg-password">Password</label>
                        <input 
                            id="reg-password"
                            type="password" 
                            className="auth-input"
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="Scegli una password forte" 
                            required
                        />
                    </div>
                    
                    <button type="submit" className="auth-button">Registrati</button>

                    {/* messaggio errore */}
                    {error && (
                        <div className="auth-error">
                            ⚠️ {error}
                        </div>
                    )}
                </form>

                {/* footer con link al login */}
                <div className="auth-footer">
                    Hai già un account? <Link to="/login" className="auth-link">Accedi qui</Link>
                </div>

            </div>
        </div>
    );
}