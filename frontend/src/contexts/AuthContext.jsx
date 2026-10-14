import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";


export const AuthContext = createContext({});

const client = axios.create({
    baseURL: `${server}/api/v1/users`
})


export const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState(() => {
        const token = localStorage.getItem("token");
        const username = localStorage.getItem("username");
        return token ? { token, username } : null;
    });

    const router = useNavigate();

    const handleRegister = async (name, username, password) => {
        try {
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password
            });

            if (request.status === httpStatus.CREATED || request.status === 200) {
                return request.data.message || "Registration successful";
            }
            return request.data.message;
        } catch (err) {
            throw err;
        }
    };

    const handleLogin = async (username, password) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password
            });

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                localStorage.setItem("username", username);
                setUserData({ token: request.data.token, username });
                router("/home");
            }
        } catch (err) {
            throw err;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setUserData(null);
        router("/auth");
    };

    const getHistoryOfUser = async () => {
        const token = localStorage.getItem("token");
        if (!token) return [];

        try {
            let request = await client.get("/get_all_activity", {
                params: {
                    token: token
                }
            });
            return request.data || [];
        } catch (err) {
            throw err;
        }
    };

    const addToUserHistory = async (meetingCode, transcript = null) => {
        const token = localStorage.getItem("token");
        if (!token) {
            // Guest or not logged in — no-op
            return null;
        }

        try {
            let request = await client.post("/add_to_activity", {
                token: token,
                meeting_code: meetingCode,
                transcript: transcript
            });
            return request.data;
        } catch (e) {
            console.error("Failed to add to history:", e);
            throw e;
        }
    };

    const data = {
        userData,
        setUserData,
        addToUserHistory,
        getHistoryOfUser,
        handleRegister,
        handleLogin,
        handleLogout
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};

