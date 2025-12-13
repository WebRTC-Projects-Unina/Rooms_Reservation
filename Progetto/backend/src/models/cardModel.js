import {pool} from "../services/db.js";

export const cardModel = {

    async getCardByUID(card_uid) {
        const [rows] = await pool.query(
        "SELECT * FROM cards WHERE card_uid = ?",
        [card_uid]
        );
        return rows[0] || null;
    }
};
