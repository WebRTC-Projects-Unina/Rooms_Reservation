// disabilita il controllo SSL per i certificati self-signed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import express from "express";
import session from "express-session";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { initDbPool } from "./src/services/db.js";
import cors from "cors";
import https from "https";
import fs from "fs";

// --- DOTENV CONFIG
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

// --- DB INIT
await initDbPool();

// --- SETUP BACKEND
const app = express();
const sessionSecret = process.env.SESSION_SECRET || "super-secret-key";
const port = process.env.BACKEND_PORT || 3000;

app.use(cors({
    origin: "https://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- SETUP USER SESSION
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true,           // https
        sameSite: 'none',       // needed in local
        maxAge: 1000 * 60 * 60  // 1h
    }
}));

// --- SETUP FOR FRONTEND
const buildPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(buildPath));

// --- SETUP ROUTES
import bookingsRoutes from "./src/routes/bookingsRoutes.js";
import readerRoutes from "./src/routes/readerRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import meetingsRoutes from "./src/routes/meetingsRoutes.js";

bookingsRoutes(app);
readerRoutes(app);
authRoutes(app);
meetingsRoutes(app);

app.get("/", (req, res) => {
    res.sendFile(path.resolve(buildPath, "index.html"));    // routing for index.html
});

// --- SETUP HTTPS SERVER
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.cert'))
};

https.createServer(httpsOptions, app).listen(port, () => {
    console.log(`Server HTTPS in ascolto su https://localhost:${port}`); 
});
