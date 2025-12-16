import {pool} from "../services/db.js";

export const bookingModel = {

    async getActiveBookingForUserInRoom(userId, roomId, dateTime) {
        const [rows] = await pool.query(
        `SELECT * FROM bookings
        WHERE user_id = ?
            AND room_id = ?
            AND status = 'active'
            AND start_time <= ? AND end_time >= ?`,
        [userId, roomId, dateTime, dateTime]
        );
        return rows[0] || null;
    },

    async setCheckInStatus(bookingId) {
        const [result] = await pool.query(
            `UPDATE bookings SET check_in = TRUE WHERE id = ?`,
            [bookingId]
        );

        return result;
    },

    async createBooking(userId, roomId, startTime, endTime) {
        const [result] = await pool.query(
            `INSERT INTO bookings (user_id, room_id, start_time, end_time, status)
             VALUES (?, ?, ?, ?, 'active')`,
            [userId, roomId, startTime, endTime]
        );

        return { id: result.insertId };
    },

    async getBookingsByUser(userId) {
        const [rows] = await pool.query(
            `SELECT b.*, r.name AS room_name
             FROM bookings b
             JOIN rooms r ON r.id = b.room_id
             WHERE b.user_id = ?
             ORDER BY b.start_time`,
            [userId]
        );
        return rows;
    },

    async getActiveBookingsByUser(userId) {
        const [rows] = await pool.query(
        `SELECT * FROM bookings
        WHERE status = 'active'
            AND user_id = ?`,
        [userId]
        );
        return rows;
    },

    async getBookingById(id) {
        const [rows] = await pool.query(
            "SELECT * FROM bookings WHERE id = ? LIMIT 1",
            [id]
        );
        return rows[0] || null;
    },

    async updateBooking(id, startTime, endTime) {
        await pool.query(
            `UPDATE bookings
             SET start_time = ?, end_time = ?
             WHERE id = ?`,
            [startTime, endTime, id]
        );
        return true;
    },

    async deleteBooking(id) {
        await pool.query(
            "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
            [id]
        );
        return true;
    },

    async hasOverlap(roomId, startTime, endTime) {
        const [rows] = await pool.query(
            `SELECT id FROM bookings
             WHERE room_id = ?
               AND status = 'active'
               AND NOT (end_time <= ? OR start_time >= ?)`,
            [roomId, startTime, endTime]
        );
        return rows.length > 0;
    }
};
