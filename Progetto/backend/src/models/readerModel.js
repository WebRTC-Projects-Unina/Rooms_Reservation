import {pool} from "../services/db.js";

export const readerModel = {

    async getReaderByUID(reader_uid) {
        const [rows] = await pool.query(
        "SELECT * FROM readers WHERE reader_uid = ?",
        [reader_uid]
        );
        return rows[0] || null;
    }
};
