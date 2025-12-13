import React from 'react';
import { useParams } from 'react-router-dom';
import VideoClassroom from '../components/VideoClassroom';

const MeetingGuest = () => {
    // legge l'id dalla rotta /live/room/:roomId
    const { roomId } = useParams();

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#222', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '90%', maxWidth: '1000px' }}>
                {roomId ? (
                    <VideoClassroom role="guest" roomId={roomId} />
                ) : (
                    <h2 style={{color: 'white'}}>ID Riunione non valido</h2>
                )}
            </div>
        </div>
    );
};

export default MeetingGuest;