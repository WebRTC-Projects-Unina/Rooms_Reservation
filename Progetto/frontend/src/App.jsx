import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import MeetingGuest from "./pages/MeetingGuest";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Rooms from "./pages/Rooms";
import MyBookings from "./pages/MyBookings";
import CreateBooking from "./pages/CreateBooking";
import EditBooking from "./pages/EditBooking";

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Navbar />

                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/rooms" element={<Rooms />} />

                    <Route path="/live/room/:roomId" element={<MeetingGuest />} />

                    <Route
                        path="/my-bookings"
                        element={<ProtectedRoute><MyBookings /></ProtectedRoute>}
                    />
                    <Route
                        path="/create-booking"
                        element={<ProtectedRoute><CreateBooking /></ProtectedRoute>}
                    />
                    <Route
                        path="/edit-booking/:id"
                        element={<ProtectedRoute><EditBooking /></ProtectedRoute>}
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
