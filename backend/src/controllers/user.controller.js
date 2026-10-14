import httpStatus from "http-status";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { supabase } from "../config/supabase.js";

// ─── LOGIN ──────────────────────────────────────────────────────────────────
const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please provide username and password" });
    }

    try {
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("username", username)
            .single();

        if (error || !user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" });
        }

        const token = crypto.randomBytes(20).toString("hex");

        await supabase
            .from("users")
            .update({ token })
            .eq("username", username);

        return res.status(httpStatus.OK).json({ token });

    } catch (e) {
        return res.status(500).json({ message: `Something went wrong: ${e}` });
    }
};

// ─── REGISTER ───────────────────────────────────────────────────────────────
const register = async (req, res) => {
    const { name, username, password } = req.body;

    try {
        const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("username", username)
            .single();

        if (existingUser) {
            return res.status(httpStatus.FOUND).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { error } = await supabase
            .from("users")
            .insert({ name, username, password: hashedPassword });

        if (error) throw error;

        return res.status(httpStatus.CREATED).json({ message: "User Registered" });

    } catch (e) {
        return res.json({ message: `Something went wrong: ${e}` });
    }
};

// ─── GET HISTORY ─────────────────────────────────────────────────────────────
const getUserHistory = async (req, res) => {
    const { token } = req.query;

    try {
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("username")
            .eq("token", token)
            .single();

        if (userError || !user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }

        const { data: meetings, error: meetingsError } = await supabase
            .from("meetings")
            .select("*")
            .eq("user_id", user.username)
            .order("date", { ascending: false });

        if (meetingsError) throw meetingsError;

        return res.json(meetings);

    } catch (e) {
        return res.json({ message: `Something went wrong: ${e}` });
    }
};

// ─── ADD TO HISTORY ──────────────────────────────────────────────────────────
const addToHistory = async (req, res) => {
    const { token, meeting_code, transcript } = req.body;

    try {
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("username")
            .eq("token", token)
            .single();

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
        return res.json({ message: `Something went wrong: ${e}` });
    }
};

export { login, register, getUserHistory, addToHistory };