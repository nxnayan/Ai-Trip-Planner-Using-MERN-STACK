const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { genkit, z } = require('genkit');
const { groq } = require('genkitx-groq');
const mongoose = require('mongoose');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  w: 'majority'
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('👉 Fix: Go to https://cloud.mongodb.com → Security → Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)');
  });


const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trips', require('./routes/trips'));

// Initialize Genkit
if (!process.env.GROQ_API_KEY) {
  console.error('❌ CRITICAL ERROR: GROQ_API_KEY is not defined in .env');
  process.exit(1);
}

const ai = genkit({
  plugins: [groq({ apiKey: process.env.GROQ_API_KEY })],
  model: 'groq/llama-3.3-70b-versatile',
});

// Define Zod Schema
const ItinerarySchema = z.object({
  destinationName: z.string(),
  imageSearchQuery: z.string().describe("A descriptive keyword to find a beautiful high-quality image of this destination on Unsplash"),
  totalDays: z.number(),
  totalTravelers: z.number(),
  budgetLevel: z.string(),
  estimatedCostINR: z.string().describe("Estimated total cost in Indian Rupees ₹"),
  budgetBreakdown: z.object({
    accommodation: z.string(),
    food: z.string(),
    transport: z.string(),
    activities: z.string()
  }),
  itinerary: z.array(z.object({
    dayNumber: z.number(),
    theme: z.string(),
    activities: z.array(z.object({
      time: z.string(),
      activityName: z.string(),
      description: z.string(),
      travelTimeFromPrevious: z.string().optional(),
      mapLink: z.string().describe("Google Maps link for this attraction")
    }))
  })),
  hotels: z.array(z.object({
    name: z.string(),
    price: z.string().describe("Price per night in INR"),
    rating: z.string().describe("Hotel rating (e.g., '4.5/5')"),
    amenities: z.array(z.string()).describe("Top 3-5 amenities"),
    description: z.string(),
    imageSearchQuery: z.string(),
    bookingLink: z.string().describe("Direct booking link or affiliate link"),
    mapLink: z.string().describe("Google Maps link for the hotel"),
    locationCoordinates: z.tuple([z.number(), z.number()]).optional().describe("Latitude and longitude of the hotel"),
  })),
  foodRecommendations: z.array(z.object({
    foodName: z.string(),
    description: z.string(),
    searchLink: z.string()
  })),
  famousSpots: z.array(z.object({
    spotName: z.string(),
    description: z.string(),
    searchLink: z.string(),
    bookingLink: z.string().optional().describe("Direct booking link for historic place, museum, or park"),
  })),
  seasonalEvents: z.array(z.object({
    eventName: z.string(),
    description: z.string(),
    dateRange: z.string().optional()
  })).optional(),
  travelTips: z.array(z.string()).describe("Tips about weather, local customs, and indoor vs outdoor contingency plans").optional(),
  hiddenGems: z.array(z.object({
    name: z.string(),
    description: z.string(),
    mapLink: z.string()
  })).optional(),
  realTimeInfo: z.object({
    weatherForecast: z.string(),
    trafficStatus: z.string(),
    localAlerts: z.array(z.string()).optional()
  }).optional(),
  chatResponse: z.string().optional().describe("A friendly message from the AI agent explaining what was changed in the itinerary")
});

app.post('/api/generate-itinerary', async (req, res) => {
  try {
    const { destination, duration, travelers, budget, interests } = req.body;

    if (!destination || !duration || !travelers) {
      return res.status(400).json({ error: 'Destination, duration, and travelers are required.' });
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const prompt = `
      Act as an advanced AI Travel Concierge. 
      Today's Date: ${currentDate}
      Generate a professional, structured travel plan for:
      - Destination: ${destination}
      - Duration: ${duration} days
      - Travelers: ${travelers}
      - Budget: ${budget}
      - Interests: ${interests || 'General sightseeing'}

      CONTEXT-AWARE & REAL-TIME REQUIREMENTS:
      1. REAL-TIME STATUS: Provide a simulated "Live Status" report for ${destination} as of ${currentDate}. Include a weather forecast (temp, condition), traffic status (busy/normal), and any hypothetical/likely local alerts (strikes, major closures, or upcoming events).
      2. WEATHER & TIPS: Provide specific travel tips. Include "Indoor vs Outdoor" advice based on the forecast.
      3. SEASONAL EVENTS: Identify any seasonal festivals or events happening in ${destination} around ${currentDate}.
      4. HIDDEN GEMS: Include 2-3 "Hidden Gems" or local-only spots.
      
      CRITICAL INSTRUCTIONS:
      1. HOTELS: Recommend 3 specific hotels matching the budget. Provide valid deep links for booking (bookingLink). Include rating, 3-5 amenities, and price per night in INR.
      2. MAPS: For every hotel and activity, provide a valid Google Maps "View on Map" link (mapLink or searchLink).
      3. ITINERARY: Create a day-wise plan. For each activity, include 'travelTimeFromPrevious' (e.g., "20 mins via taxi") and a specific time (e.g., "10:00 AM").
      4. VALUE: Prioritize the best value options within the ${budget} budget.
    `;

    console.log('🤖 Generating itinerary for:', destination);

    const { output } = await ai.generate({
      prompt: prompt,
      output: {
        schema: ItinerarySchema
      }
    });

    if (!output) {
      throw new Error('AI returned empty output');
    }

    console.log('✅ Itinerary generated for:', destination);
    res.json(output);

  } catch (error) {
    console.error('❌ Error generating itinerary:', error.message);
    res.status(500).json({ error: 'Failed to generate itinerary: ' + error.message });
  }
});

app.post('/api/refine-itinerary', async (req, res) => {
  try {
    const { currentItinerary, message } = req.body;

    if (!currentItinerary || !message) {
      return res.status(400).json({ error: 'Current itinerary and message are required.' });
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const prompt = `
      Act as an expert Travel Agent. 
      You are helping a client refine their travel plan.
      
      CURRENT ITINERARY:
      ${JSON.stringify(currentItinerary)}
      
      USER REQUEST:
      "${message}"
      
      INSTRUCTIONS:
      1. Modify the CURRENT ITINERARY based on the USER REQUEST.
      2. If they say "Add a beach day", insert a relevant day.
      3. If they say "Reduce budget", adjust hotels and activities.
      4. If they say "Replace X with Y", make those specific swaps.
      5. MAINTAIN the overall structure and JSON format.
      6. Today's Date is ${currentDate}. Ensure all context (weather, real-time info) remains consistent or updated if relevant.
      7. Provide an optional 'bookingLink' for all 'famousSpots'.
      8. RETURN a 'locationCoordinates' array for each hotel as [lat, lng] (e.g., [19.0760, 72.8777]). Include it alongside the existing 'mapLink' and 'bookingLink'.
      9. Keep the JSON structure valid.
      10. Use the 'chatResponse' field to explain briefly what you changed.
    `;

    console.log('🔄 Refining itinerary for:', currentItinerary.destinationName);

    try {
      const { output } = await ai.generate({
        prompt: prompt,
        output: {
          schema: ItinerarySchema
        }
      });

      if (!output) {
        throw new Error('AI returned empty output during refinement');
      }

      res.json(output);
    } catch (aiError) {
      console.error('❌ AI Generation Error:', aiError);
      res.status(500).json({ error: 'AI failed to update the plan. Try rephrasing your request.' });
    }

  } catch (error) {
    console.error('❌ Endpoint Error:', error.message);
    res.status(500).json({ error: 'Internal server error during refinement.' });
  }
});

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`✅ AI Backend server running on port ${port}`);
    console.log(`👉 API URL: http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} is busy. Trying ${port + 1}...`);
      startServer(port + 1); // keep trying next ports until free
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });
};

const PORT = parseInt(process.env.PORT) || 5000;
startServer(PORT);
