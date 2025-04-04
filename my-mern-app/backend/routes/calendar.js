import express from 'express';
import CalendarEvent from '../models/CalendarEvent.js';

const router = express.Router();

// Get all events for a user
router.get('/:userId', async (req, res) => {
  const events = await CalendarEvent.find({ userId: req.params.userId });
  res.json(events);
});

// Create a new event
router.post('/', async (req, res) => {
  const newEvent = new CalendarEvent(req.body);
  await newEvent.save();
  res.status(201).json(newEvent);
});

// Update an event
router.put('/:id', async (req, res) => {
  const updated = await CalendarEvent.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// Delete an event
router.delete('/:id', async (req, res) => {
  await CalendarEvent.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

export default router;
