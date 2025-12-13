import * as reader from "../controllers/readerController.js";

export default function readerRoutes(app) {
    app.route("/api/controlla-accesso")
        .post(reader.checkAccess);
};
