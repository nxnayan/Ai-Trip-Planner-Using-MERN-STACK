const express = require('express');
const router = express.Router();
const fetch = require('node-fetch'); // If needed for external API

// Mock function – replace with real hotel API call
const mockHotels = (destination) => {
  // Simple deterministic mock based on destination name length
  const base = destination.length;
  return Array.from({ length: 3 }, (_, i) => ({
    name: `${destination} Hotel ${i + 1}`,
    price: `${5000 + i * 1500} INR/night`,
    rating: `${4 + i * 0.2}/5`,
    amenities: ['Free WiFi', 'Breakfast', 'Pool', 'Gym'].slice(0, 3 + i),
    description: `A comfortable stay in ${destination} with excellent service.`,
    imageSearchQuery: `${destination} Hotel ${i + 1}`,
    bookingLink: `https://example.com/book/${destination.toLowerCase()}-hotel-${i + 1}`,
    mapLink: `https://www.google.com/maps/search/${encodeURIComponent(destination + ' Hotel ' + (i + 1))}`,
    locationCoordinates: [
      19.0 + i * 0.01,
      72.0 + i * 0.01
    ]
  }));
};

router.get('/', async (req, res) => {
  const { destination } = req.query;
  if (!destination) {
    return res.status(400).json({ error: 'destination query param required' });
  }
  // In real implementation, call external API here:
  // const apiResponse = await fetch(`https://hotelapi.example.com/search?...`);
  // const data = await apiResponse.json();
  // For now return mock data:
  const hotels = mockHotels(destination);
  res.json({ hotels });
});

module.exports = router;
