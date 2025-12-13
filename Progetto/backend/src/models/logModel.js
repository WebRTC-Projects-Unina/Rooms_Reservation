import {pool} from "../services/db.js";

export const logModel = {

    async createLog(cardId, readerId, accessGranted, message) {
        await pool.query(
        `INSERT INTO access_logs (card_id, reader_id, access_granted, message)
        VALUES (?, ?, ?, ?)`,
        [cardId, readerId, accessGranted ? 1 : 0, message]
        );
    }
};
