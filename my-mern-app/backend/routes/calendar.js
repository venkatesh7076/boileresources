import express from 'express';
import CalendarEvent from '../models/CalendarEvent.js';

const router = express.Router();

// Get all events for a user
router.get('/:userId', async (req, res) => {
  try {
    const events = await CalendarEvent.find({ userId: req.params.userId });
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ message: "Error fetching events" });
  }
});

// Create a new event
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      title,
      details, // ✅ comes from frontend
      start,
      end,
    } = req.body;

    const newEvent = new CalendarEvent({
      userId,
      title,
      description: details, // ✅ maps to backend schema
      start,
      end,
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ message: "Error creating event" });
  }
});

// Update an event
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
    };

    // If 'details' is included, map it to 'description'
    if (req.body.details) {
      updateData.description = req.body.details;
    }

    const updated = await CalendarEvent.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ message: "Error updating event" });
  }
});

// Delete an event
router.delete('/:id', async (req, res) => {
  try {
    await CalendarEvent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ message: "Error deleting event" });
  }
});

export default router;
