# Meetly 📹

A real-time video conferencing web application built with **React**, **Node.js**, **Express**, **Socket.IO**, **WebRTC**, and **MongoDB**.

---

## 📁 Repository Structure

```text
meetly/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── socketManager.js       # WebRTC signaling & real-time chat logic
│   │   │   └── user.controller.js     # Auth & meeting history handlers
│   │   ├── models/
│   │   │   ├── meeting.model.js       # Meeting history schema
│   │   │   └── user.model.js          # User schema
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
│   │   │   ├── history.jsx            # User's meeting history
│   │   │   └── VideoMeet.jsx          # Video conference room (WebRTC + Chat)
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
MONGO_URI=your_mongodb_connection_string
PORT=8000
```
Run the server:
```bash
npm run dev
```

### 2. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm start
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).