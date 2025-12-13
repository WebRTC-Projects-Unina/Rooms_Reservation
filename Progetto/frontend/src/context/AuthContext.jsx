import { createContext, useContext, useState, useEffect } from "react";
import { apiGet, apiPost } from "../api";

// il context è un meccanismo fornito da React che ti permette di condividere dati tra i componenti (es. lo stato)

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);         // dichiara lo stato locale per tenere traccia dell'utente loggato
    const [loading, setLoading] = useState(true);   // stato di caricamento della pagina (per non reindirizzare a login quando si ricarica la pagina)

    async function checkAuth() {
        try {
            const res = await apiGet("/auth/me");
            if (res.loggedIn) {
                setUser(res.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Errore checkAuth:", error);
            setUser(null);
        } finally {
            // finito il controllo (con successo o errore), togliamo il caricamento
            setLoading(false);
        }
    }

    async function login(username, password) {
        const res = await apiPost("/auth/login", { username, password });
        if (res.userId) await checkAuth();      // se il login ha successo, chiama checkAuth per aggiornare lo stato dell'utente locale
        return res;
    }

    async function logout() {
        await apiPost("/auth/logout");
        setUser(null);
    }

    async function register(username, password) {
        const res = await apiPost("/auth/register", { username, password });
        if (res.userId) await checkAuth();
        return res;
    }

    // viene eseguito al montaggio del componente, verifica subito se l'utente è loggato
    useEffect(() => {
        checkAuth();
    }, []);

    // rende disponibile ai componenti figli i valori user, login, logout e register.
    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading }}>
            {children}      
        </AuthContext.Provider>
    );
}
