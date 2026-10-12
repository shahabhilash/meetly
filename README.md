# Meetly

Meetly is a full-stack web application featuring video conferencing and real-time communication.

## Project Structure
- `frontend`: React-based frontend.
- `backend`: Node.js/Express backend with Socket.io and MongoDB.

## Getting Started

### Prerequisites
- Node.js installed
- MongoDB database (local or Atlas)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Ensure there is a `.env` file in the `backend` directory containing your MongoDB URI:
   ```env
   MONGO_URI="your_mongodb_connection_string"
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
   The backend will run on port 8000.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```

## License
[MIT License](LICENSE)