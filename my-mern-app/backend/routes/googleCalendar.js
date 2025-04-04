import express from "express";
import { google } from "googleapis";
import CalendarEvent from "../models/CalendarEvent.js";
import verifyJWT from "../config/verifyJWT.js";

const router = express.Router();

router.post("/", verifyJWT, async (req, res) => {
  try {
    const user = req.user;
    if (!user.refreshToken) {
      return res.status(400).json({ error: "No refresh token found for user" });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "http://localhost:5001/api/auth/google/callback"
    );

    oauth2Client.setCredentials({ refresh_token: user.refreshToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const events = await CalendarEvent.find({ userId: user._id });

    for (const e of events) {
      await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: e.title,
          description: e.details || "", // ✅ include event details in description
          start: {
            dateTime: new Date(e.start).toISOString(),
            timeZone: "America/New_York", // optional but recommended
          },
          end: {
            dateTime: new Date(e.end).toISOString(),
            timeZone: "America/New_York",
          },
        },
      });
    }

    res.json({ message: "Export successful" });
  } catch (err) {
    console.error("❌ Google Calendar export failed:", err.message);
    res.status(500).json({ error: "Export failed" });
  }
});

export default router;
