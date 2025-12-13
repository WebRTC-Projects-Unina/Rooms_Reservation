import bcrypt from "bcrypt";
import {userModel} from "../models/userModel.js";

// const saltRounds = 10;        // good for testing (not secure)
// const saltRounds = 12;        // good for production

// --- LOGIN
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Inserisci username e password" });
        }

        const user = await userModel.findByUsername(username);

        const genericError = "Credenziali non valide";    // messaggio generico per non rivelare informazioni

        if (!user) {
            return res.status(401).json({ error: genericError });
        }

        const correct = await bcrypt.compare(password, user.password_hash);

        if (!correct) {
            return res.status(401).json({ error: genericError });
        }

        req.session.userId = user.id;

        res.json({ message: "Login effettuato", userId: user.id });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({ error: "Errore interno server" });
    }
};


// --- REGISTER
export const register = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password)
            return res.status(400).json({ error: "Inserisci username e password" });

        const existing = await userModel.findByUsername(username);
        if (existing)
            return res.status(400).json({ error: "Username già esistente" });

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await userModel.createUser(username, passwordHash);

        req.session.userId = newUser.id;

        res.json({ message: "Registrazione completata", userId: newUser.id });

    } catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).json({ error: "Errore interno server" });
    }
};

// --- LOGOUT
export const logout = (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: "Errore nel logout" });
        res.clearCookie("connect.sid");
        res.json({ message: "Logout completato" });
    });
};

// --- RICHIEDI LOGIN (PER PAGINE PROTETTE)
export const requireLogin = (req, res, next) => {
    if (req.session.userId) return next();

    const acc = req.headers.accept || "";
    if (acc.includes("text/html")) {
        return res.redirect("/login");
    }
    return res.status(401).json({ error: "Devi essere loggato" });
};

// --- CHECK IF LOGGED
export const checkLogged = async (req, res) => {
    if (!req.session.userId) {
        return res.json({ loggedIn: false });
    }

    const user = await userModel.findById(req.session.userId);
        
    // se la sessione esiste ma l'utente è stato cancellato dal db
    if (!user) {
        req.session.destroy();
        return res.json({ loggedIn: false });
    }
    
    res.json({
        loggedIn: true,
        user: {
            id: req.session.userId,
            username: user.username
        }
    });
};
