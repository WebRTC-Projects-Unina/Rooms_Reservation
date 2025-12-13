import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    // se stiamo ancora controllando l'auth, mostriamo un caricamento
    if (loading) {
        return <div>Caricamento in corso...</div>; // O uno spinner carino
    }

    if (!user) return <Navigate to="/login" replace />;

    return children;
}
