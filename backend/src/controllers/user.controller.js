import httpStatus from "http-status";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { supabase } from "../config/supabase.js";

// ─── LOGIN ──────────────────────────────────────────────────────────────────
const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide username and password" });
    }

    try {
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("username", username)
            .maybeSingle();

        if (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
        }

        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" });
        }

        const token = crypto.randomBytes(20).toString("hex");

        const { error: updateError } = await supabase
            .from("users")
            .update({ token })
            .eq("username", username);

        if (updateError) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: updateError.message });
        }

        return res.status(httpStatus.OK).json({ token });

    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message || e}` });
    }
};

// ─── REGISTER ───────────────────────────────────────────────────────────────
const register = async (req, res) => {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide name, username, and password" });
    }

    try {
        const { data: existingUser, error: checkError } = await supabase
            .from("users")
            .select("id")
            .eq("username", username)
            .maybeSingle();

        if (checkError) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: checkError.message });
        }

        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { error } = await supabase
            .from("users")
            .insert({ name, username, password: hashedPassword });

        if (error) throw error;

        return res.status(httpStatus.CREATED).json({ message: "User Registered" });

    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message || e}` });
    }
};

// ─── GET HISTORY ─────────────────────────────────────────────────────────────
const getUserHistory = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "Token is required" });
    }

    try {
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("username")
            .eq("token", token)
            .maybeSingle();

        if (userError || !user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }

        const { data: meetings, error: meetingsError } = await supabase
            .from("meetings")
            .select("*")
            .eq("user_id", user.username)
            .order("date", { ascending: false });

        if (meetingsError) throw meetingsError;

        return res.status(httpStatus.OK).json(meetings || []);

    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message || e}` });
    }
};

// ─── ADD TO HISTORY ──────────────────────────────────────────────────────────
const addToHistory = async (req, res) => {
    const { token, meeting_code, transcript } = req.body;

    if (!token || !meeting_code) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Token and meeting code are required" });
    }

    try {
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("username")
            .eq("token", token)
            .maybeSingle();

        if (userError || !user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }

        const { error } = await supabase
            .from("meetings")
            .insert({
                user_id: user.username,
                meeting_code,
                transcript: transcript || null
            });

        if (error) throw error;

        return res.status(httpStatus.CREATED).json({ message: "Added to history" });

    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message || e}` });
    }
};

export { login, register, getUserHistory, addToHistory };