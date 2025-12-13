import { bookingModel } from "../models/bookingModel.js";
import { roomModel } from "../models/roomModel.js";

// helper per convertire la data JS in formato compatibile con mariadb 'YYYY-MM-DD HH:MM:SS'
const toSqlDate = (dateObj) => {
    return dateObj.toISOString().slice(0, 19).replace('T', ' ');
};

// --- LISTA AULE DISPONIBILI
export const listRooms = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: "Parametri mancanti: start ed end sono obbligatori." });
    }

    const startTime = new Date(start);
    const endTime = new Date(end);

    // validazione Date
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return res.status(400).json({ error: "Formato data/ora non valido. Usa ISO 8601." });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: "L'orario di inizio deve essere precedente alla fine." });
    }

    // conversione per mariadb
    const sqlStart = toSqlDate(startTime);
    const sqlEnd = toSqlDate(endTime);

    // recupera stanze
    const rooms = await roomModel.getAllRooms();

    const result = [];
    for (const r of rooms) {
      const overlap = await bookingModel.hasOverlap(r.id, sqlStart, sqlEnd);
      result.push({
        id: r.id,
        name: r.name,
        location: r.location,
        capacity: r.capacity,
        available: !overlap
      });
    }

    return res.json({ 
        start: startTime.toISOString(), 
        end: endTime.toISOString(), 
        rooms: result 
    });

  } catch (err) {
    console.error("Errore in listRooms:", err);
    return res.status(500).json({ error: "Errore interno server" });
  }
};


// --- RECUPERA SINGOLA PRENOTAZIONE UTENTE
export const getUserBookingById = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId    = req.session.userId;
        const booking   = await bookingModel.getBookingById(bookingId);

        if (!booking) {
            return res.status(404).json({ error: "Prenotazione non trovata" });
        }

        if (booking.user_id !== userId) {
            return res.status(403).json({ error: "Non puoi visualizzare questa prenotazione" });
        }

        res.json({ booking });

    } catch (err) {
        console.error("Errore in getUserBookingById:", err);
        res.status(500).json({ error: "Errore nel recupero della prenotazione" });
    }
};


// --- RECUPERA TUTTE LE PRENOTAZIONI UTENTE
export const getUserBookings = async (req, res) => {
    try {
        const userId = req.session.userId;
        const bookings = await bookingModel.getActiveBookingsByUser(userId);
        res.json({ bookings });
    } catch (err) {
        console.error("Errore in getUserBookings:", err);
        res.status(500).json({ error: "Errore nel recupero delle prenotazioni" });
    }
};


// --- CREA PRENOTAZIONE
export const createBooking = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { roomId, startTime, endTime } = req.body;

        if (!roomId || !startTime || !endTime) {
            return res.status(400).json({ error: "Dati mancanti" });
        }

        // conversione e validazione date
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return res.status(400).json({ error: "Formato date non valido" });
        }

        if (start >= end) {
            return res.status(400).json({ error: "La data di inizio deve essere prima della fine" });
        }

        // formattazione per mariadb
        const sqlStart = toSqlDate(start);
        const sqlEnd = toSqlDate(end);

        // check esistenza stanza
        const room = await roomModel.getRoomById(roomId);
        if (!room) {
            return res.status(404).json({ error: "Stanza inesistente" });
        }

        // check sovrapposizione
        const overlap = await bookingModel.hasOverlap(roomId, sqlStart, sqlEnd);
        if (overlap) {
            return res.status(400).json({
                error: "La stanza è già occupata in quell'orario"
            });
        }

        // creazione
        const booking = await bookingModel.createBooking(
            userId,
            roomId,
            sqlStart,
            sqlEnd
        );

        res.json({
            message: "Prenotazione creata con successo",
            bookingId: booking.id
        });

    } catch (err) {
        console.error("Errore in createBooking:", err);
        res.status(500).json({ error: "Errore durante la creazione della prenotazione" });
    }
};


// --- MODIFICA PRENOTAZIONE
export const updateBooking = async (req, res) => {
    try {
        const userId = req.session.userId;
        const bookingId = req.params.id;
        const { startTime, endTime } = req.body;

        if (!startTime || !endTime) {
            return res.status(400).json({ error: "Dati mancanti" });
        }

        // conversione e validazione date
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return res.status(400).json({ error: "Formato date non valido" });
        }
        
        if (start >= end) {
             return res.status(400).json({ error: "La data di inizio deve essere prima della fine" });
        }

        // formattazione per mariadb
        const sqlStart = toSqlDate(start);
        const sqlEnd = toSqlDate(end);

        // check esistenza prenotazione
        const booking = await bookingModel.getBookingById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: "Prenotazione non trovata" });
        }

        // check ownership
        if (booking.user_id !== userId) {
            return res.status(403).json({ error: "Non puoi modificare questa prenotazione" });
        }

        // check sovrapposizione
        const overlap = await bookingModel.hasOverlap(
            booking.room_id,
            sqlStart,
            sqlEnd
        );

        // se c’è sovrapposizione, dobbiamo capire se stiamo sovrapponendo noi stessi.
        const currentDbStart = toSqlDate(new Date(booking.start_time));
        const currentDbEnd = toSqlDate(new Date(booking.end_time));

        // logica: se c'è overlap, ma i tempi richiesti sono identici a quelli attuali, allora ok (nessuna modifica reale di orario).
        // altrimenti, se i tempi cambiano e c'è overlap, allora errore.
        if (overlap && !(currentDbStart === sqlStart && currentDbEnd === sqlEnd)) {
            return res.status(400).json({
                error: "Nuovo orario non disponibile, stanza occupata"
            });
        }

        // update
        await bookingModel.updateBooking(bookingId, sqlStart, sqlEnd);

        res.json({ message: "Prenotazione aggiornata correttamente" });

    } catch (err) {
        console.error("Errore in updateBooking:", err);
        res.status(500).json({ error: "Errore nell'aggiornamento della prenotazione" });
    }
};


// --- ELIMINA PRENOTAZIONE (soft delete → status='cancelled')
export const deleteBooking = async (req, res) => {
    try {
        const userId = req.session.userId;
        const bookingId = req.params.id;

        const booking = await bookingModel.getBookingById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: "Prenotazione non trovata" });
        }

        if (booking.user_id !== userId) {
            return res.status(403).json({ error: "Non hai permesso per eliminarla" });
        }

        await bookingModel.deleteBooking(bookingId);

        res.json({ message: "Prenotazione cancellata" });

    } catch (err) {
        console.error("Errore in deleteBooking:", err);
        res.status(500).json({ error: "Errore nella cancellazione della prenotazione" });
    }
};