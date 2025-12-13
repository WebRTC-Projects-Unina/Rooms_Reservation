import {pool} from "../services/db.js";

export const userModel = {

    async findByUsername(username) {
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE username = ? LIMIT 1",
            [username]
        );
        return rows[0] || null;
    },

    async findById(id) {
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE id = ? LIMIT 1",
            [id]
        );
        return rows[0] || null;
    },

    async createUser(username, passwordHash) {
        const [result] = await pool.query(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            [username, passwordHash]
        );

        return {
            id: result.insertId,
            username,
            passwordHash
        };
    }
};
