import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        socket.on("join-call", (path) => {
            if (!connections[path]) {
                connections[path] = [];
            }
            if (!connections[path].includes(socket.id)) {
                connections[path].push(socket.id);
            }

            timeOnline[socket.id] = new Date();

            // Notify all participants in this room about the new user
            for (let i = 0; i < connections[path].length; i++) {
                io.to(connections[path][i]).emit("user-joined", socket.id, connections[path]);
            }

            // Send past chat messages in this room to the joining user
            if (messages[path] && messages[path].length > 0) {
                for (let i = 0; i < messages[path].length; ++i) {
                    io.to(socket.id).emit(
                        "chat-message",
                        messages[path][i].data,
                        messages[path][i].sender,
                        messages[path][i]["socket-id-sender"]
                    );
                }
            }
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            // Find room containing socket.id
            let matchingRoom = null;
            for (const [room, clientList] of Object.entries(connections)) {
                if (clientList.includes(socket.id)) {
                    matchingRoom = room;
                    break;
                }
            }

            if (matchingRoom) {
                if (!messages[matchingRoom]) {
                    messages[matchingRoom] = [];
                }

                messages[matchingRoom].push({
                    sender: sender,
                    data: data,
                    "socket-id-sender": socket.id
                });

                connections[matchingRoom].forEach((clientId) => {
                    io.to(clientId).emit("chat-message", data, sender, socket.id);
                });
            }
        });

        socket.on("disconnect", () => {
            delete timeOnline[socket.id];

            for (const room of Object.keys(connections)) {
                const index = connections[room].indexOf(socket.id);
                if (index !== -1) {
                    connections[room].splice(index, 1);
                    // Notify other participants that this user left
                    for (const remainingClient of connections[room]) {
                        io.to(remainingClient).emit("user-left", socket.id);
                    }
                    if (connections[room].length === 0) {
                        delete connections[room];
                        delete messages[room];
                    }
                }
            }
        });
    });

    return io;
};


