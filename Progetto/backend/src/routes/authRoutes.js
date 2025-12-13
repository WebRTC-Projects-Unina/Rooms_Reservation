import * as auth from "../middleware/authMiddleware.js";

export default function authRoutes(app) {
    app.post("/auth/login", auth.login);
    app.post("/auth/logout", auth.logout);
    app.post("/auth/register", auth.register);
    app.get("/auth/me", auth.checkLogged);
};
