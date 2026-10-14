import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import { Collapse, IconButton, Snackbar, Alert, CircularProgress, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DownloadIcon from '@mui/icons-material/Download';
import withAuth from '../utils/withAuth';

function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const history = await getHistoryOfUser();
                setMeetings(Array.isArray(history) ? history : []);
            } catch (err) {
                console.error("Error fetching history:", err);
                setErrorMsg("Failed to load meeting history");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "N/A";
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const downloadTranscript = (meeting) => {
        if (!meeting.transcript) return;
        const blob = new Blob([meeting.transcript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const code = meeting.meeting_code || meeting.meetingCode || "meeting";
        a.download = `transcript-${code}-${formatDate(meeting.date).replace(/\//g, '-')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ padding: '24px 16px', maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <IconButton onClick={() => routeTo("/home")} color="primary" title="Go to Home">
                    <HomeIcon />
                </IconButton>
                <Typography variant="h5" fontWeight={700} style={{ margin: 0 }}>
                    Meeting History
                </Typography>
            </div>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
                    <CircularProgress />
                </Box>
            ) : meetings.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
                    No meetings recorded yet.
                </Typography>
            ) : (
                meetings.map((e, i) => (
                    <Card key={e.id || i} variant="outlined" style={{ marginBottom: '12px', borderRadius: '12px' }}>
                        <CardContent>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Typography variant="body1" fontWeight={600}>
                                        Code: <strong>{e.meeting_code || e.meetingCode}</strong>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Date: {formatDate(e.date)}
                                    </Typography>
                                </div>

                                {e.transcript && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <Button
                                            size="small"
                                            startIcon={<DownloadIcon />}
                                            onClick={() => downloadTranscript(e)}
                                            variant="outlined"
                                        >
                                            Transcript
                                        </Button>
                                        <IconButton
                                            size="small"
                                            onClick={() => setExpandedId(expandedId === i ? null : i)}
                                        >
                                            {expandedId === i ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </IconButton>
                                    </div>
                                )}
                            </div>

                            {/* Transcript Expand */}
                            {e.transcript && (
                                <Collapse in={expandedId === i} timeout="auto" unmountOnExit>
                                    <div style={{
                                        marginTop: '12px',
                                        background: '#f5f5f5',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        maxHeight: '260px',
                                        overflowY: 'auto',
                                        fontFamily: 'monospace',
                                        fontSize: '12px',
                                        lineHeight: '1.7',
                                        whiteSpace: 'pre-wrap',
                                        color: '#333'
                                    }}>
                                        {e.transcript}
                                    </div>
                                </Collapse>
                            )}
                        </CardContent>
                    </Card>
                ))
            )}

            <Snackbar
                open={Boolean(errorMsg)}
                autoHideDuration={4000}
                onClose={() => setErrorMsg("")}
            >
                <Alert severity="error" onClose={() => setErrorMsg("")}>
                    {errorMsg}
                </Alert>
            </Snackbar>
        </div>
    );
}

export default withAuth(History);

