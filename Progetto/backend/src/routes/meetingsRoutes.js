import * as auth from "../middleware/authMiddleware.js";
import * as meetings from "../controllers/meetingsController.js";

export default function meetingsRoutes(app) {
    // crea la stanza su janus per la riunione
    app.route("/api/crea-riunione/:id")
        .post(auth.requireLogin, meetings.startMeeting);
};
