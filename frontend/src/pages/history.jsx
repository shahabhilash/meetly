import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import { Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DownloadIcon from '@mui/icons-material/Download';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch {
                // IMPLEMENT SNACKBAR
            }
        }
        fetchHistory();
    }, [])

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    const downloadTranscript = (meeting) => {
        const blob = new Blob([meeting.transcript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-${meeting.meeting_code}-${formatDate(meeting.date)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div style={{ padding: '16px', maxWidth: '720px', margin: '0 auto' }}>
            <IconButton onClick={() => routeTo("/home")} style={{ marginBottom: '12px' }}>
                <HomeIcon />
            </IconButton>

            <Typography variant="h5" gutterBottom fontWeight={700}>
                Meeting History
            </Typography>

            {meetings.length === 0
                ? <Typography color="text.secondary">No meetings recorded yet.</Typography>
                : meetings.map((e, i) => (
                    <Card key={i} variant="outlined" style={{ marginBottom: '12px', borderRadius: '12px' }}>
                        <CardContent>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Typography variant="body2" color="text.secondary">
                                        Code: <strong>{e.meetingCode || e.meeting_code}</strong>
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
                        </CardContent>
                    </Card>
                ))
            }
        </div>
    )
}
