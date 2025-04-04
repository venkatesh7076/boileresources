import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  details: String, // ✅ renamed from "description" to "details"
  start: Date,
  end: Date,
  recurrenceRule: String, // optional
  location: String,
  timeZone: String,
  googleEventId: String, // optional
  isSynced: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('CalendarEvent', calendarEventSchema);
