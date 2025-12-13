import * as auth from "../middleware/authMiddleware.js";
import * as bookings from "../controllers/bookingsController.js";

export default function bookingsRoutes(app) {
    // lista aule
    app.route("/api/aule-disponibili")
        .get(bookings.listRooms);
    // crea prenotazione
    app.route("/api/crea-prenotazione")
        .post(auth.requireLogin, bookings.createBooking);
    // recupera tutte le prenotazioni utente
    app.route("/api/prenotazioni")
        .get(auth.requireLogin, bookings.getUserBookings);
    // recupera una prenotazione utente
    app.route("/api/prenotazioni/:id")
        .get(auth.requireLogin, bookings.getUserBookingById);
    // modifica prenotazione
    app.route("/api/prenotazioni/:id")
        .put(auth.requireLogin, bookings.updateBooking);
    // elimina prenotazione
    app.route("/api/prenotazioni/:id")
        .delete(auth.requireLogin, bookings.deleteBooking);
};
