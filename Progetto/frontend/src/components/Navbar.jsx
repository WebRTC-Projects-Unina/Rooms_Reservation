import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../style/Navbar.css";

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="navbar">
            {/* 1. LOGO */}
            <Link to="/" className="nav-logo">
                SpaceHub 💬
            </Link>

            {/* LINK CENTRALI DI NAVIGAZIONE */}
            <div className="nav-links">
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/rooms" className="nav-link">Aule</Link>

                {user && (
                    <Link to="/my-bookings" className="nav-link">
                        Le mie prenotazioni
                    </Link>
                )}
            </div>

            {/* AZIONI UTENTE (DESTRA) */}
            <div className="nav-auth">
                {user ? (
                    <>
                        {/* bottone per creare prenotazione in evidenza */}
                        <Link to="/rooms" className="btn-primary">
                            + Nuova Prenotazione
                        </Link>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "15px", borderLeft: "1px solid #eee", paddingLeft: "15px" }}>
                            <span className="user-greeting">Ciao, {user.username}</span>
                            <button onClick={logout} className="btn-logout">
                                🚪 Logout
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="btn-secondary">
                            Login
                        </Link>
                        <Link to="/register" className="btn-primary">
                            Registrati
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}