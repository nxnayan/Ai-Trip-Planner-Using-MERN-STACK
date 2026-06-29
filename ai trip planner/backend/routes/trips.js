const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Trip = require('../models/Trip');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const authMiddleware = require('../middleware/auth');

const generateId = () => Math.random().toString(36).substr(2, 9);

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { destinationName, itineraryData } = req.body;
    const newTrip = new Trip({
      user: req.user.userId,
      destinationName,
      itineraryData
    });
    
    await newTrip.save();
    res.json(newTrip);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userTrips = await Trip.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json(userTrips);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
