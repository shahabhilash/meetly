import React, { useContext, useEffect, useRef, useState } from 'react';
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import ArticleIcon from '@mui/icons-material/Article';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import server from '../environment';
import { AuthContext } from '../contexts/AuthContext';
import { useParams } from 'react-router-dom';

const server_url = server;

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
};

// ── WebRTC Fallback Utilities ──────────────────────────────────────────────────
const silence = () => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return new MediaStreamTrack();
        const ctx = new AudioCtx();
        const oscillator = ctx.createOscillator();
        const dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    } catch (e) {
        return null;
    }
};

const black = ({ width = 640, height = 480 } = {}) => {
    try {
        const canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        const stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    } catch (e) {
        return null;
    }
};

const blackSilence = (...args) => {
    const tracks = [];
    const b = black(...args);
    const s = silence();
    if (b) tracks.push(b);
    if (s) tracks.push(s);
    return new MediaStream(tracks);
};

export default function VideoMeetComponent() {
    const { url: routeMeetingCode } = useParams();
    const { addToUserHistory, userData } = useContext(AuthContext);

    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const localVideoref = useRef(null);
    const connectionsRef = useRef({});
    const videoRef = useRef([]);
    const recognitionRef = useRef(null);
    const isTranscribingRef = useRef(false);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [screen, setScreen] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [showModal, setModal] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState(() => {
        return userData?.username || localStorage.getItem("username") || "";
    });

    // ── Transcript state ──────────────────────────────────────────
    const [transcript, setTranscript] = useState([]);
    const [showTranscript, setShowTranscript] = useState(false);
    const [videos, setVideos] = useState([]);

    // ── 1. Request permissions once on mount ──────────────────────
    const getPermissions = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (stream) {
                setVideoAvailable(true);
                setAudioAvailable(true);
                window.localStream = stream;
                if (localVideoref.current) {
                    localVideoref.current.srcObject = stream;
                }
            }
        } catch (error) {
            console.warn("Could not get both video/audio, attempting individual fallbacks", error);
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                setVideoAvailable(true);
                setAudioAvailable(false);
                window.localStream = videoStream;
                if (localVideoref.current) localVideoref.current.srcObject = videoStream;
            } catch (vErr) {
                setVideoAvailable(false);
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    setAudioAvailable(true);
                    window.localStream = audioStream;
                    if (localVideoref.current) localVideoref.current.srcObject = audioStream;
                } catch (aErr) {
                    setAudioAvailable(false);
                }
            }
        }

        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            setScreenAvailable(true);
        } else {
            setScreenAvailable(false);
        }
    };

    useEffect(() => {
        getPermissions();

        return () => {
            // Full cleanup on unmount
            if (window.localStream) {
                try {
                    window.localStream.getTracks().forEach(track => track.stop());
                } catch (e) { }
            }
            for (let id in connectionsRef.current) {
                try {
                    connectionsRef.current[id].close();
                } catch (e) { }
            }
            connectionsRef.current = {};
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            stopTranscription();
        };
    }, []);

    // Ensure local stream is assigned when view switches from lobby to call
    useEffect(() => {
        if (!askForUsername && localVideoref.current && window.localStream) {
            localVideoref.current.srcObject = window.localStream;
        }
    }, [askForUsername]);

    // ── 2. Socket and WebRTC connections ──────────────────────────
    const gotMessageFromServer = (fromId, messageData) => {
        let signal;
        try {
            signal = JSON.parse(messageData);
        } catch (e) {
            return;
        }

        if (fromId !== socketIdRef.current && connectionsRef.current[fromId]) {
            const pc = connectionsRef.current[fromId];
            if (signal.sdp) {
                pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        pc.createAnswer().then((description) => {
                            pc.setLocalDescription(description).then(() => {
                                if (socketRef.current) {
                                    socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': pc.localDescription }));
                                }
                            }).catch(e => console.log(e));
                        }).catch(e => console.log(e));
                    }
                }).catch(e => console.log(e));
            }

            if (signal.ice) {
                pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
            }
        }
    };

    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            const roomCode = routeMeetingCode || window.location.pathname.replace(/^\//, '') || "default";
            socketRef.current.emit('join-call', roomCode);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left', (id) => {
                if (connectionsRef.current[id]) {
                    try {
                        connectionsRef.current[id].close();
                    } catch (e) { }
                    delete connectionsRef.current[id];
                }
                setVideos((prevVideos) => prevVideos.filter((video) => video.socketId !== id));
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    if (socketListId === socketIdRef.current) return;
                    if (connectionsRef.current[socketListId]) return; // Don't recreate existing connections

                    const pc = new RTCPeerConnection(peerConfigConnections);
                    connectionsRef.current[socketListId] = pc;

                    pc.onicecandidate = function (event) {
                        if (event.candidate != null && socketRef.current) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                        }
                    };

                    pc.onaddstream = (event) => {
                        let videoExists = videoRef.current.find(v => v.socketId === socketListId);
                        if (videoExists) {
                            setVideos(prev => {
                                const updated = prev.map(v =>
                                    v.socketId === socketListId ? { ...v, stream: event.stream } : v
                                );
                                videoRef.current = updated;
                                return updated;
                            });
                        } else {
                            const newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };
                            setVideos(prev => {
                                const updated = [...prev, newVideo];
                                videoRef.current = updated;
                                return updated;
                            });
                        }
                    };

                    const currentStream = window.localStream || blackSilence();
                    try {
                        pc.addStream(currentStream);
                    } catch (e) {
                        currentStream.getTracks().forEach(track => pc.addTrack(track, currentStream));
                    }
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connectionsRef.current) {
                        if (id2 === socketIdRef.current) continue;

                        connectionsRef.current[id2].createOffer().then((description) => {
                            connectionsRef.current[id2].setLocalDescription(description)
                                .then(() => {
                                    if (socketRef.current) {
                                        socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connectionsRef.current[id2].localDescription }));
                                    }
                                })
                                .catch(e => console.log(e));
                        }).catch(e => console.log(e));
                    }
                }
            });
        });
    };

    // ── 3. Media Controls (Mic, Cam, Screen) ──────────────────────
    const handleVideo = () => {
        const nextState = !video;
        setVideo(nextState);
        if (window.localStream) {
            window.localStream.getVideoTracks().forEach(track => {
                track.enabled = nextState;
            });
        }
    };

    const handleAudio = () => {
        const nextState = !audio;
        setAudio(nextState);
        if (window.localStream) {
            window.localStream.getAudioTracks().forEach(track => {
                track.enabled = nextState;
            });
        }
    };

    const handleScreen = async () => {
        if (!screen) {
            try {
                const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                setScreen(true);
                const screenTrack = displayStream.getVideoTracks()[0];

                // Replace video track in peer connections
                for (let id in connectionsRef.current) {
                    const pc = connectionsRef.current[id];
                    if (pc.getSenders) {
                        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                        if (sender) sender.replaceTrack(screenTrack);
                    }
                }

                if (localVideoref.current) {
                    localVideoref.current.srcObject = displayStream;
                }

                screenTrack.onended = () => {
                    stopScreenSharing();
                };
            } catch (err) {
                console.error("Screen share error:", err);
                setScreen(false);
            }
        } else {
            stopScreenSharing();
        }
    };

    const stopScreenSharing = () => {
        setScreen(false);
        if (window.localStream) {
            const camTrack = window.localStream.getVideoTracks()[0];
            if (camTrack) {
                for (let id in connectionsRef.current) {
                    const pc = connectionsRef.current[id];
                    if (pc.getSenders) {
                        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                        if (sender) sender.replaceTrack(camTrack);
                    }
                }
            }
            if (localVideoref.current) {
                localVideoref.current.srcObject = window.localStream;
            }
        }
    };

    // ── 4. Live Speech Transcription ──────────────────────────────
    const startTranscription = (speakerName) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const lastResult = event.results[event.results.length - 1];
                if (lastResult && lastResult.isFinal) {
                    const text = lastResult[0].transcript.trim();
                    if (text) {
                        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        setTranscript(prev => [...prev, { speaker: speakerName, text, time }]);
                    }
                }
            };

            recognition.onerror = (e) => {
                if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                    isTranscribingRef.current = false;
                }
            };

            recognition.onend = () => {
                if (isTranscribingRef.current) {
                    try {
                        recognition.start();
                    } catch (e) { }
                }
            };

            isTranscribingRef.current = true;
            recognition.start();
            recognitionRef.current = recognition;
        } catch (err) {
            console.error("SpeechRecognition failed:", err);
        }
    };

    const stopTranscription = () => {
        isTranscribingRef.current = false;
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) { }
            recognitionRef.current = null;
        }
    };

    const downloadTranscript = () => {
        const content = transcript
            .map(l => `[${l.time}] ${l.speaker}: ${l.text}`)
            .join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meetly-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── 5. End Call Handler ───────────────────────────────────────
    const handleEndCall = async () => {
        stopTranscription();

        if (window.localStream) {
            try {
                window.localStream.getTracks().forEach(track => track.stop());
            } catch (e) { }
        }

        for (let id in connectionsRef.current) {
            try {
                connectionsRef.current[id].close();
            } catch (e) { }
        }
        connectionsRef.current = {};

        if (socketRef.current) {
            try {
                socketRef.current.disconnect();
            } catch (e) { }
        }

        try {
            const meetingCode = routeMeetingCode || window.location.pathname.split('/').pop();
            const transcriptText = transcript
                .map(l => `[${l.time}] ${l.speaker}: ${l.text}`)
                .join('\n');
            await addToUserHistory(meetingCode, transcriptText);
        } catch (e) {
            // Guest or error saving
        }

        window.location.href = "/home";
    };

    // ── 6. Chat Messaging ─────────────────────────────────────────
    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prev) => [...prev, { sender, data }]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prev) => prev + 1);
        }
    };

    const sendMessage = () => {
        if (!message.trim() || !socketRef.current) return;
        const senderName = username.trim() || 'Guest';
        socketRef.current.emit('chat-message', message.trim(), senderName);
        setMessage("");
    };

    const handleConnectFromLobby = () => {
        const effectiveUsername = username.trim() || `User_${Math.floor(1000 + Math.random() * 9000)}`;
        setUsername(effectiveUsername);
        setAskForUsername(false);
        connectToSocketServer();
        startTranscription(effectiveUsername);
    };

    return (
        <div>
            {askForUsername ? (
                <div className={styles.lobbyContainer}>
                    <div className={styles.lobbyCard}>
                        <h2>Ready to join?</h2>
                        <video
                            className={styles.lobbyVideo}
                            ref={localVideoref}
                            autoPlay
                            muted
                            playsInline
                        />

                        <TextField
                            fullWidth
                            id="outlined-username"
                            label="Your Name / Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleConnectFromLobby()}
                            variant="outlined"
                            placeholder="Enter your name"
                        />

                        <Button
                            fullWidth
                            size="large"
                            variant="contained"
                            onClick={handleConnectFromLobby}
                        >
                            Join Meeting
                        </Button>
                    </div>
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>
                    {/* Chat Drawer */}
                    {showModal && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Chat</h2>
                                    <IconButton size="small" onClick={() => setModal(false)}>
                                        <CloseIcon />
                                    </IconButton>
                                </div>

                                <div className={styles.chattingDisplay}>
                                    {messages.length === 0 ? (
                                        <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>No messages yet</p>
                                    ) : (
                                        messages.map((item, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    background: item.sender === username ? '#e3f2fd' : '#f5f5f5',
                                                    borderRadius: '8px',
                                                    padding: '8px 12px',
                                                    alignSelf: item.sender === username ? 'flex-end' : 'flex-start',
                                                    maxWidth: '85%'
                                                }}
                                            >
                                                <p style={{ fontWeight: 600, fontSize: '11px', color: '#1976d2', margin: '0 0 2px 0' }}>
                                                    {item.sender}
                                                </p>
                                                <p style={{ margin: 0, fontSize: '13px', wordBreak: 'break-word' }}>
                                                    {item.data}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className={styles.chattingArea}>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Type a message..."
                                        variant="outlined"
                                    />
                                    <IconButton color="primary" onClick={sendMessage} disabled={!message.trim()}>
                                        <SendIcon />
                                    </IconButton>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Control Bar */}
                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "white" }} title="Toggle Camera">
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton onClick={handleEndCall} style={{ color: "#ef4444" }} title="End Call">
                            <CallEndIcon />
                        </IconButton>

                        <IconButton onClick={handleAudio} style={{ color: "white" }} title="Toggle Microphone">
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable && (
                            <IconButton onClick={handleScreen} style={{ color: "white" }} title="Share Screen">
                                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton>
                        )}

                        <Badge badgeContent={newMessages} max={999} color="primary">
                            <IconButton
                                onClick={() => {
                                    setModal(!showModal);
                                    setNewMessages(0);
                                }}
                                style={{ color: "white" }}
                                title="Chat"
                            >
                                <ChatIcon />
                            </IconButton>
                        </Badge>

                        <Badge badgeContent={transcript.length} max={999} color="secondary">
                            <IconButton
                                onClick={() => setShowTranscript(!showTranscript)}
                                style={{ color: "white" }}
                                title="Live Transcript"
                            >
                                <ArticleIcon />
                            </IconButton>
                        </Badge>
                    </div>

                    {/* Live Transcript Panel */}
                    {showTranscript && (
                        <div style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            width: '320px',
                            maxWidth: '100vw',
                            height: '100%',
                            background: 'rgba(15,15,15,0.95)',
                            display: 'flex',
                            flexDirection: 'column',
                            zIndex: 35,
                            borderLeft: '1px solid #333'
                        }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>📝 Live Transcript</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={downloadTranscript}
                                        style={{ color: '#90caf9', borderColor: '#90caf9', fontSize: '11px' }}
                                    >
                                        Download
                                    </Button>
                                    <IconButton size="small" onClick={() => setShowTranscript(false)} style={{ color: '#fff' }}>
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {transcript.length === 0 ? (
                                    <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
                                        🎤 Transcript will appear here as you speak...
                                    </p>
                                ) : (
                                    transcript.map((line, i) => (
                                        <div key={i} style={{ background: '#1e1e1e', borderRadius: '8px', padding: '8px 10px' }}>
                                            <span style={{ color: '#90caf9', fontSize: '11px', fontWeight: 600 }}>{line.speaker}</span>
                                            <span style={{ color: '#aaa', fontSize: '10px', marginLeft: '8px' }}>{line.time}</span>
                                            <p style={{ color: '#e0e0e0', margin: '4px 0 0', fontSize: '13px', lineHeight: 1.4 }}>{line.text}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Local User Preview Video */}
                    <video
                        className={styles.meetUserVideo}
                        ref={localVideoref}
                        autoPlay
                        muted
                        playsInline
                    />

                    {/* Remote Peers Video Conference Grid */}
                    <div className={styles.conferenceView}>
                        {videos.map((v) => (
                            <div key={v.socketId}>
                                <video
                                    data-socket={v.socketId}
                                    ref={ref => {
                                        if (ref && v.stream) {
                                            ref.srcObject = v.stream;
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
