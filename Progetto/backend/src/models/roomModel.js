import {pool} from "../services/db.js";

export const roomModel = {

    async getAllRooms() {
        const [rows] = await pool.query("SELECT * FROM rooms ORDER BY name");
        return rows;
    },

    async getRoomById(id) {
        const [rows] = await pool.query(
            "SELECT * FROM rooms WHERE id = ? LIMIT 1",
            [id]
        );
        return rows[0] || null;
    },

    async createRoom(name, location, capacity) {
        const [result] = await pool.query(
            "INSERT INTO rooms (name, location, capacity) VALUES (?, ?, ?)",
            [name, location, capacity]
        );

        return {
            id: result.insertId,
            name,
            location,
            capacity
        };
    }
};
