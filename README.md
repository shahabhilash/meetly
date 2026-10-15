# Meetly 📹

A real-time, browser-based video conferencing web application designed for seamless peer-to-peer communication, collaboration, and instant meetings.

---

## 📌 About Meetly

**Meetly** enables users to initiate and participate in video conferences without friction. Powered by WebRTC and Socket.IO, it delivers low-latency media streaming and synchronized group messaging directly in the browser—with support for both guest access and authenticated user accounts.

### ✨ Key Features
- **🎥 Real-Time Video & Audio**: Peer-to-peer audio/video streaming via WebRTC with camera and microphone toggles.
- **📝 Live Speech Transcription**: Real-time speech-to-text powered by the Web Speech API with speaker attribution and timestamps.
- **📥 Transcript Export & History**: Download transcripts on-the-fly (`.txt`) or review and download full transcripts archived automatically in your Meeting History.
- **🖥️ Screen Sharing**: Broadcast your screen or presentation window with one click.
- **💬 In-Call Live Chat**: Instant messaging during active meetings with unread message badges.
- **👥 Flexible Joining**: Join meetings instantly with a room code as a guest, or create an account for full features.
- **🔐 User Authentication**: Secure sign-up/login with bcrypt-hashed passwords and token-based sessions.
- **📜 Meeting History**: Automatically log and review past meeting codes, session dates, and transcripts.

---

## 🛠️ Tech Stack

- **Frontend**: React (v18), Material UI (MUI), React Router (v6), Socket.IO Client, Axios, Web Speech API
- **Backend**: Node.js, Express, Socket.IO, Supabase JS, Bcrypt, Dotenv
- **Protocols & Database**: WebRTC, WebSockets, Supabase (PostgreSQL)


---

## 📁 Repository Structure

```text
meetly/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js            # Supabase database client configuration
│   │   ├── controllers/
│   │   │   ├── socketManager.js       # WebRTC signaling & real-time chat logic
│   │   │   └── user.controller.js     # Auth & meeting history handlers
│   │   ├── routes/
│   │   │   └── users.routes.js        # API endpoints (/login, /register, etc.)
│   │   └── app.js                     # Server entry point & Socket.IO initialization
│   ├── .env.example                   # Environment variable template
│   ├── .gitignore
│   └── package.json
│
├── frontend/
│   ├── public/                        # Static assets (HTML, icons, images)
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx        # Auth state management & API client
│   │   ├── pages/
│   │   │   ├── landing.jsx            # Landing page (Join as guest / Login)
│   │   │   ├── authentication.jsx     # Sign In & Sign Up forms
│   │   │   ├── home.jsx               # Dashboard to join/create meetings
│   │   │   ├── history.jsx            # Meeting history with transcript viewer
│   │   │   └── VideoMeet.jsx          # Video room (WebRTC, Chat & Live Transcript)
│   │   ├── styles/                    # Component CSS modules
│   │   ├── utils/                     # Route guards (withAuth)
│   │   ├── App.js                     # Route definitions
│   │   └── environment.js             # API base URL configuration
│   ├── .gitignore
│   └── package.json
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## ⚡ Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in `backend/` (refer to `.env.example`):
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=8000
```
Run the server:
```bash
npm run dev
```

### 2. Frontend Setup
In a separate terminal:
```bash
cd frontend
npm install
npm start
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).