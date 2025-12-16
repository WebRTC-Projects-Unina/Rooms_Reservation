import React, { useEffect, useRef, useState } from 'react';
import Janus from '../utils/janus';
import { apiPost, apiGet } from '../api';
import '../style/VideoClassroom.css'; 

const VideoClassroom = ({ role, roomId, initialCheckIn = false }) => {
    const janusRef = useRef(null);
    const roomHandleRef = useRef(null);
    const subHandleRef = useRef(null);
    
    const audioRef = useRef(null); // per audio
    const videoRef = useRef(null); // per condivisione schermo
    
    // stati
    const [hasJoined, setHasJoined] = useState(false);
    const [status, setStatus] = useState("In attesa...");
    const [error, setError] = useState(null);
    const [isAudioActive, setIsAudioActive] = useState(false);      // stato condivisione audio
    const [isScreenSharing, setIsScreenSharing] = useState(false);  // stato condivisione schermo
    const [isMuted, setIsMuted] = useState(false);                  // stato per mutare il microfono

    // stati per il controllo check-in fisico
    const [isCheckedIn, setIsCheckedIn] = useState(initialCheckIn); 
    // se initialCheckIn è già true, non dobbiamo caricare (isLoadingCheck = false)
    const [isLoadingCheck, setIsLoadingCheck] = useState(role === 'host' && !initialCheckIn); 

    const MY_ROOM_ID = parseInt(roomId);

    // questa funzione serve a verificare se l'host ha fatto check-in
    useEffect(() => {
        let intervalId; 

        const checkPhysicalPresence = async () => {
            if (role !== 'host' || isCheckedIn) return;

            try {
                const booking = await apiGet(`/api/prenotazioni/${MY_ROOM_ID}`);
                
                if (booking && booking.check_in) {
                    setIsCheckedIn(true);
                    if (intervalId) clearInterval(intervalId);
                } else {
                    setIsCheckedIn(false);
                }
            } catch (err) {
                console.warn("Check-in polling error:", err);
            } finally {
                setIsLoadingCheck(false);
            }
        };

        // eseguiamo il controllo solo se l'utente non è già check-in
        if (!isCheckedIn) {
            checkPhysicalPresence();
            if (role === 'host') {
                intervalId = setInterval(checkPhysicalPresence, 3000);
            }
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [role, MY_ROOM_ID, isCheckedIn]);

    // questa funzione apre websocket verso la porta 8989 e crea una sessione
    const startJanus = () => {
        Janus.init({
            debug: "all",
            callback: () => {
                if (!Janus.isWebrtcSupported()) {
                    setError("Browser non supportato");
                    return;
                }
                
                // sessione
                const janusInstance = new Janus({
                    server: "wss://localhost:8989",
                    // aggiunto server di stun google per client
                    iceServers: [
            { urls: "stun:stun.l.google.com:19302" }
              ],
                    success: () => {
                        janusRef.current = janusInstance;
                        setStatus("Connesso. Entro nella stanza...");
                        
                        if (role === 'host') {
                            startHostLogic(janusInstance);
                        } else {
                            startGuestLogic(janusInstance);
                        }
                    },
                    error: (err) => setError("Errore Sessione: " + err),
                    destroyed: () => setStatus("Sessione terminata")
                });
            }
        });
    };

    useEffect(() => {
        return () => {
            if (janusRef.current) {
                janusRef.current.destroy();
                janusRef.current = null;
            }
        };
    }, []);

    // funzione per gestire il click "Avvia/Partecipa"
    const handleJoin = async () => {
        // blocco se host non ha fatto check-in
        if (role === 'host' && !isCheckedIn) {
            alert("Devi prima passare il badge sul lettore all'ingresso dell'aula per confermare la presenza!");
            return;
        }

        setHasJoined(true);

        // se sono host, chiedo al backend di creare la stanza su Janus
        if (role === 'host') {
            try {
                setStatus("Creazione stanza sul server...");
                // chiamata all'API del backend
                const res = await apiPost(`/api/crea-riunione/${MY_ROOM_ID}`);
                
                // gestione errori restituiti dal backend
                if (res.error) {
                    setError("Errore server: " + res.error);
                    return;
                }
                
                console.log("✅ Backend: Stanza creata/verificata con successo");

            } catch (err) {
                console.error(err);
                setError("Impossibile contattare il server per creare la riunione.");
                return;
            }
        }

        // se sono Guest o se l'host ha creato la stanza con successo, avviamo WebRTC
        setStatus("Connessione in corso...");
        startJanus();
    };

    // --- LOGICA HOST
    const startHostLogic = (janus) => {
        janus.attach({
            plugin: "janus.plugin.videoroom",
            opaqueId: "host-" + Janus.randomString(12),
            success: (pluginHandle) => {
                roomHandleRef.current = pluginHandle;

                // definizione della richiesta di join
                // nota: la creazione della stanza viene fatta dal backend
                const joinRequest = { 
                    request: "join", 
                    room: MY_ROOM_ID, 
                    ptype: "publisher", 
                    display: "Host" 
                };

                // join nella stanza creata
                pluginHandle.send({ message: joinRequest });
            },
            error: (err) => setError("Errore plugin: " + err),
            onmessage: (msg, jsep) => {
                const event = msg["videoroom"];
                if (event === "joined") {
                    setStatus("Host entrato. Richiedo condivisione schermo e audio...");
                    
                    // crea offerta con audio e video (screen)
                    roomHandleRef.current.createOffer({
                        media: { video: "screen", audioSend: true, videoSend: true }, 
                        success: (jsep) => {
                            console.log("🖥️ Offerta Audio+Screen creata");
                            // audio e video entrambi a true
                            const publish = { request: "configure", audio: true, video: true };
                            roomHandleRef.current.send({ message: publish, jsep: jsep });
                            
                            // se siamo qui, l'utente ha cliccato "Condividi" nel browser
                            setIsScreenSharing(true);
                            setStatus("Trasmissione in corso"); // aggiorniamo lo stato
                        },
                        error: (err) => {
                            console.error("Errore offerta (probabile annullamento screen share):", err);
                            setError("Condivisione schermo annullata o fallita: " + err);
                            // resettiamo lo stato se fallisce
                            setStatus("Errore avvio condivisione");
                        }
                    });
                }
                if (jsep) {
                    roomHandleRef.current.handleRemoteJsep({ jsep: jsep });
                }
            },
            onlocalstream: (stream) => {
                setIsAudioActive(true);     // l'host non ha bisogno di vedere/sentire se stesso
            }
        });
    };

    // funzione per mutare/smutare il microfono host
    const toggleMute = () => {
        if (!roomHandleRef.current) return;
        
        if (isMuted) {
            roomHandleRef.current.unmuteAudio();
            setIsMuted(false);
        } else {
            roomHandleRef.current.muteAudio();
            setIsMuted(true);
        }
    };

    // --- LOGICA GUEST
    const startGuestLogic = (janus) => {
        janus.attach({
            plugin: "janus.plugin.videoroom",
            opaqueId: "guest-" + Janus.randomString(12),
            success: (pluginHandle) => {
                roomHandleRef.current = pluginHandle;
                pluginHandle.send({ 
                    message: { request: "join", room: MY_ROOM_ID, ptype: "publisher", display: "Guest" } 
                });
            },
            error: (err) => setError("Errore guest: " + err),
            onmessage: (msg, jsep) => {
                const event = msg["videoroom"];
                if (event === "joined" || event === "event") {
                    // controlliamo se l'host è presente
                    if (msg["publishers"] && msg["publishers"].length > 0) {
                        const hostId = msg["publishers"][0].id;
                        subscribeToHost(janus, hostId);
                    } else if (event === "joined") {
                        // se non c'è nessuno, mostriamo il messaggio di attesa
                        setStatus("Connesso. In attesa che l'host inizi la trasmissione...");
                    }
                }
            }
        });
    };

    // funzione per iscriversi allo stream dell'host
    const subscribeToHost = (janus, feedId) => {
        if (subHandleRef.current) return;

        janus.attach({
            plugin: "janus.plugin.videoroom",
            opaqueId: "sub-" + Janus.randomString(12),
            success: (handle) => {
                subHandleRef.current = handle;
                handle.send({ 
                    message: { request: "join", room: MY_ROOM_ID, ptype: "subscriber", feed: feedId } 
                });
            },
            onmessage: (msg, jsep) => {
                if (jsep) {
                    console.log("📨 Ricevuta offerta (Audio o Screen)...");
                    subHandleRef.current.createAnswer({
                        jsep: jsep,
                        media: { audioSend: false, videoSend: false }, 
                        success: (jsepAnswer) => {
                            const body = { request: "start", room: MY_ROOM_ID };
                            subHandleRef.current.send({ message: body, jsep: jsepAnswer });
                            // se riceviamo dati, aggiorniamo lo stato
                            setStatus("Connesso alla riunione");
                        },
                        error: (err) => console.error("Errore Answer:", err)
                    });
                }
            },
            onremotetrack: (track, mid, on) => {
                if (!on) return; 

                if (track.kind === 'audio') {
                    console.log("🔊 Traccia Audio rilevata");
                    const stream = new MediaStream([track]);
                    attachAudioStream(stream);
                } 
                else if (track.kind === 'video') {
                    console.log("🖥️ Traccia Video (Schermo) rilevata");
                    const stream = new MediaStream([track]);
                    attachVideoStream(stream);
                }
            }
        });
    };

    const attachAudioStream = (stream) => {
        if (audioRef.current && audioRef.current.srcObject !== stream) {
            Janus.attachMediaStream(audioRef.current, stream);
            audioRef.current.play().catch(e => console.warn("Autoplay audio:", e));
            setIsAudioActive(true);
        }
    };

    const attachVideoStream = (stream) => {
        if (videoRef.current && videoRef.current.srcObject !== stream) {
            Janus.attachMediaStream(videoRef.current, stream);
            videoRef.current.play().catch(e => console.warn("Autoplay video:", e));
        }
    };

    // --- RENDER UI    
    if (!hasJoined) {
        return (
            <div className="vc-container">
                <div className="vc-card">
                    <h1 className="vc-title">🎓 Aula Virtuale</h1>
                    <p>Stai per entrare nella riunione <b>#{roomId}</b>.</p>
                    
                    {/* mostriamo avviso se l'host non è entrato in aula (check-in) */}
                    {role === 'host' && !isLoadingCheck && !isCheckedIn ? (
                        <div style={{ color: 'red', fontWeight: 'bold', border: '1px solid red', padding: '10px', borderRadius: '5px', backgroundColor: '#fff0f0' }}>
                            ⛔ Accesso fisico non rilevato.<br/>
                            Per avviare la riunione passare la carta sul lettore.
                        </div>
                    ) : (
                        <button 
                            onClick={handleJoin} 
                            className="vc-btn vc-btn-primary"
                            disabled={isLoadingCheck} // disabilitato solo mentre carica
                        >
                            {isLoadingCheck ? 'Verifica accesso...' : (role === 'host' ? '🎙️ Avvia riunione' : '🎧 Partecipa alla riunione')}
                        </button>
                    )}

                </div>
            </div>
        );
    };

    return (
        <div className="vc-container">
            <div className="vc-header">
                <h2>{role === 'host' ? 'Trasmissione' : 'Partecipazione'}</h2>
                <span className="vc-status-dot" style={{ color: error ? 'red' : 'green' }}>
                    ● {error || status}
                </span>
            </div>
            
            <div className="vc-video-container">
                {/* il video viene renderizzato solo per i guest */}
                {role === 'guest' && (
                    <video 
                        ref={videoRef} 
                        width="100%" 
                        height="auto" 
                        autoPlay 
                        playsInline 
                        muted={true} 
                        className="vc-video-elem"
                    />
                )}
                
                {/* audio invisibile ma sempre presente */}
                <audio ref={audioRef} autoPlay playsInline controls={role==='guest'} style={{display: role==='guest' ? 'block' : 'none', marginTop: '10px'}} />
            </div>

            {/* pulsanti di controllo per host */}
            {role === 'host' && (
                <div className="vc-controls">
                    <div style={{ marginBottom: '10px' }}>
                         <button 
                            onClick={toggleMute} 
                            className={`vc-btn ${isMuted ? 'vc-btn-red' : 'vc-btn-green'}`}
                        >
                            {isMuted ? '🔇 Microfono DISATTIVATO' : '🎤 Microfono ATTIVO'}
                        </button>
                    </div>
                    
                    {/* mostra solo se l'utente ha accettato la condivisione */}
                    {isScreenSharing && (
                        <div className="vc-screen-active">
                            🖥️ Condivisione Schermo Attiva
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VideoClassroom;