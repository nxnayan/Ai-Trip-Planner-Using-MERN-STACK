const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  destinationName: {
    type: String,
    required: true,
  },
  itineraryData: {
    type: Object, // Stores the full JSON response from the AI
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Trip', TripSchema);
