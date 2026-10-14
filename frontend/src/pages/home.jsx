import React, { useContext, useState } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import "../App.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory, handleLogout } = useContext(AuthContext);

    const handleJoinVideoCall = async (codeToJoin) => {
        const targetCode = (codeToJoin || meetingCode).trim();
        if (!targetCode) return;

        try {
            await addToUserHistory(targetCode);
        } catch (e) {
            console.error("Could not record meeting history:", e);
        }
        navigate(`/${targetCode}`);
    };

    const handleCreateNewMeeting = () => {
        const randomCode = Math.random().toString(36).substring(2, 10);
        handleJoinVideoCall(randomCode);
    };

    return (
        <>
            <div className="navBar">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <h2>Meetly</h2>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <IconButton onClick={() => navigate("/history")} title="Meeting History">
                        <RestoreIcon />
                    </IconButton>
                    <p style={{ cursor: "pointer", margin: 0 }} onClick={() => navigate("/history")}>History</p>

                    <Button variant="outlined" color="inherit" onClick={handleLogout} sx={{ ml: 2 }}>
                        Logout
                    </Button>
                </div>
            </div>

            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2>Providing Quality Video Calls Just Like Quality Education</h2>

                        <div style={{ display: 'flex', gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "20px" }}>
                            <TextField
                                value={meetingCode}
                                onChange={e => setMeetingCode(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleJoinVideoCall()}
                                id="outlined-basic"
                                label="Meeting Code"
                                variant="outlined"
                                placeholder="Enter meeting code"
                                size="small"
                            />
                            <Button
                                onClick={() => handleJoinVideoCall()}
                                variant='contained'
                                disabled={!meetingCode.trim()}
                            >
                                Join
                            </Button>
                            <Button
                                onClick={handleCreateNewMeeting}
                                variant='outlined'
                                startIcon={<VideoCallIcon />}
                            >
                                New Meeting
                            </Button>
                        </div>
                    </div>
                </div>
                <div className='rightPanel'>
                    <img src='/logo3.png' alt="Meetly logo" />
                </div>
            </div>
        </>
    );
}

export default withAuth(HomeComponent);