import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import './index.css';
import { Plane, MapPin, Calendar, Users, Loader2, LogOut, User as UserIcon, Save, History, ExternalLink, Send, MessageCircle, Download } from 'lucide-react';

function App() {
  const [view, setView] = useState('landing'); // 'landing', 'form', 'loading', 'itinerary', 'auth', 'history'
  const [formData, setFormData] = useState({
    destination: '', duration: '', travelers: '', budget: 'Medium', interests: ''
  });
  const [itinerary, setItinerary] = useState(null);

  // Auth State
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });

  // History State
  const [trips, setTrips] = useState([]);

  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const setBudget = (level) => {
    setFormData(prev => ({ ...prev, budget: level }));
  };

  const handleAuthChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLoginView ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await response.json();
      if (response.ok) {
        setToken(data.token);
        setUserEmail(data.email);
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', data.email);
        setView('landing');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Error connecting to server.");
    }
  };

  const logout = () => {
    setToken(null);
    setUserEmail(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setView('landing');
  };

  const API_BASE_URL = 'http://localhost:5000';

  const generateItinerary = async () => {
    if (!token) {
      alert("Please log in to generate your trip!");
      setView('auth');
      return;
    }

    if (!formData.destination || !formData.duration || !formData.travelers) {
      alert("Please fill in the required fields (Destination, Duration, Travelers)");
      return;
    }

    setView('loading');

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setItinerary(data);
        setView('itinerary');
        setChatHistory([{ role: 'agent', message: "Here's your initial itinerary! How can I help you adjust it?" }]);
      } else {
        alert(data.error || "Failed to generate itinerary");
        setView('form');
      }
    } catch (error) {
      console.error("Connection Error:", error);
      alert(`Error connecting to AI Backend at ${API_BASE_URL}. Please ensure the server is running on port 5000.`);
      setView('form');
    }
  };

  const refineItinerary = async (e) => {
    if (e) e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', message: userMsg }]);
    setChatMessage('');
    setIsRefining(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/refine-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentItinerary: itinerary,
          message: userMsg
        })
      });

      const data = await response.json();

      if (response.ok) {
        setItinerary(data);
        const agentMsg = data.chatResponse || `I've updated your plan based on: "${userMsg}". What do you think?`;
        setChatHistory(prev => [...prev, { role: 'agent', message: agentMsg }]);
      } else {
        alert(data.error || "Failed to refine itinerary");
      }
    } catch (error) {
      console.error("Refinement Connection Error:", error);
      alert("Error connecting to AI Chat Assistant. Check your internet or server status.");
    } finally {
      setIsRefining(false);
    }
  };

  const downloadPDF = async () => {
  if (!itinerary) {
    alert('No itinerary to download');
    return;
  }
  try {
    const element = document.getElementById('itinerary-content');
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Add hotel booking links
    if (itinerary.hotels && itinerary.hotels.length) {
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Hotel Booking Links', 10, 20);
      let y = 30;
      itinerary.hotels.forEach((hotel) => {
        const link = hotel.bookingLink || '';
        pdf.setFontSize(12);
        pdf.text(`${hotel.name}: ${link}`, 10, y);
        if (link) {
          pdf.link(10, y - 5, pdf.getStringUnitWidth(`${hotel.name}: ${link}`) * pdf.internal.scaleFactor * 0.3528, 7, { url: link });
        }
        y += 10;
      });
    }
    pdf.save(`${itinerary.destinationName.replace(/\s+/g, '_')}_itinerary.pdf`);
  } catch (e) {
    console.error('PDF generation error', e);
    alert('Failed to generate PDF');
  }
};
const saveTrip = async () => {
  if (!itinerary) {
    alert('No itinerary to save. Generate one first.');
    return;
  }
  if (!token) {
    alert("Please login first to save trips!");
    setView('auth');
    return;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        destinationName: itinerary.destinationName,
        itineraryData: itinerary
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error('Save trip failed:', errText);
      alert(`Failed to save trip: ${errText}`);
      return;
    }
    const data = await response.json();
    alert('Trip saved successfully!');
  } catch (err) {
    console.error('Error saving trip:', err);
    alert('Error saving trip.');
  }
};


  const fetchHistory = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setTrips(data);
      }
    } catch (err) { }
  };

  const viewSavedTrip = (savedItinerary) => {
    setItinerary(savedItinerary);
    setView('itinerary');
  };

  return (
    <div className="app-wrapper">
      <header className="glass no-print" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setView('landing')}>
            <Plane size={28} className="text-gradient" stroke="url(#gradient)" style={{ marginRight: '12px' }} />
            <svg width="0" height="0">
              <linearGradient id="gradient" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop stopColor="#ec4899" offset="0%" />
                <stop stopColor="#8b5cf6" offset="100%" />
              </linearGradient>
            </svg>
            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>AI Trip Planner</h2>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {token ? (
              <>
                <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '14px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setView('history')}>
                  <History size={16} /> My Trips
                </button>
                <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={logout}>
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }} onClick={() => setView('auth')}>
                <UserIcon size={16} /> Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '60px', flex: 1, paddingBottom: '60px' }}>
        {view === 'landing' && (
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '40px auto 0', padding: '60px 0' }}>
            <h1 style={{ fontSize: '4.5rem', fontWeight: '700', marginBottom: '24px', lineHeight: '1.1', letterSpacing: '-0.02em' }}>
              Your Dream Vacation,<br /><span className="text-gradient">Planned in Seconds</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '48px' }}>
              Tell us where you want to go and what you love doing. Our AI will craft an optimized, personalized itinerary instantly.
            </p>
            <button className="btn-primary" style={{ fontSize: '1.1rem', padding: '16px 36px', borderRadius: '30px' }} onClick={() => token ? setView('form') : setView('auth')}>
              Start Planning Now <Plane size={20} />
            </button>
          </div>
        )}

        {view === 'auth' && (
          <div className="glass" style={{ padding: '40px', maxWidth: '400px', margin: '40px auto' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '24px', textAlign: 'center' }}>
              {isLoginView ? 'Welcome Back' : 'Create Account'}
            </h2>
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!isLoginView && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Full Name</label>
                  <input type="text" name="name" value={authForm.name} onChange={handleAuthChange} required className="input-glass" placeholder="John Doe" />
                </div>
              )}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
                <input type="email" name="email" value={authForm.email} onChange={handleAuthChange} required className="input-glass" placeholder="you@example.com" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
                <input type="password" name="password" value={authForm.password} onChange={handleAuthChange} required className="input-glass" placeholder="••••••••" />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
                {isLoginView ? 'Sign In' : 'Sign Up'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)' }}>
              {isLoginView ? "Don't have an account? " : "Already have an account? "}
              <span style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '600' }} onClick={() => setIsLoginView(!isLoginView)}>
                {isLoginView ? 'Sign Up' : 'Sign In'}
              </span>
            </p>
          </div>
        )}

        {view === 'form' && (
          <div className="glass" style={{ padding: '40px', maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Let's build your trip</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Destination</label>
                <input type="text" name="destination" value={formData.destination} onChange={handleInputChange} className="input-glass" placeholder="Where to? (e.g., Kyoto, Japan)" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Duration (Days)</label>
                  <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} className="input-glass" placeholder="e.g., 5" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Travelers</label>
                  <input type="number" name="travelers" value={formData.travelers} onChange={handleInputChange} className="input-glass" placeholder="e.g., 2" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Budget Level</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['Low', 'Medium', 'Luxury'].map(level => (
                    <button key={level} className={formData.budget === level ? "btn-primary" : "btn-secondary"} style={{ flex: 1 }} onClick={() => setBudget(level)}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Interests & Style</label>
                <input type="text" name="interests" value={formData.interests} onChange={handleInputChange} className="input-glass" placeholder="e.g., Spicy Food, History, Nature" />
              </div>
              <button className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '16px' }} onClick={generateItinerary}>
                Generate Magic Itinerary ✨
              </button>
            </div>
          </div>
        )}

        {view === 'loading' && (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Loader2 size={64} className="text-gradient" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 24px auto' }} />
            <h2 style={{ fontSize: '2rem' }}>Crafting your AI Itinerary...</h2>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {view === 'history' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '32px' }}>My Saved Trips</h2>
            {trips.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', textAlign: 'center', padding: '40px' }}>You haven't saved any trips yet. <span style={{ color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={() => setView('form')}>Plan one now!</span></p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {trips.map(trip => (
                  <div key={trip._id} className="glass" style={{ padding: '24px', cursor: 'pointer', transition: 'transform 0.2s ease' }} onClick={() => viewSavedTrip(trip.itineraryData)}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{trip.destinationName}</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0' }}>{trip.itineraryData.totalDays} Days • {trip.itineraryData.budgetLevel}</p>
                    <p style={{ color: 'var(--accent-primary)', fontWeight: 'bold', marginTop: '16px', marginBottom: '0' }}>View Itinerary →</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'itinerary' && itinerary && (
          <div id="itinerary-content">
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <button className="btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setView('landing')}>← Back</button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={downloadPDF}><Download size={16} /> Download PDF</button>
                <button className="btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={saveTrip}><Save size={16} /> Save Trip</button>
              </div>
            </div>

            {/* Real-Time Status Banner */}
            {itinerary.realTimeInfo && (
              <div className="glass" style={{ padding: '16px 24px', marginBottom: '24px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '8px', color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>LIVE</div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>{itinerary.realTimeInfo.weatherForecast}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🚦 {itinerary.realTimeInfo.trafficStatus}</p>
                  </div>
                </div>
                {itinerary.realTimeInfo.localAlerts && itinerary.realTimeInfo.localAlerts.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {itinerary.realTimeInfo.localAlerts.map((alert, idx) => (
                      <span key={idx} style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: '600' }}>
                        ⚠️ {alert}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="glass" style={{ padding: '40px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{itinerary.destinationName}</h1>
                  <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> {itinerary.totalDays} Days</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={16} /> {itinerary.totalTravelers} People</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>💰 {itinerary.budgetLevel}</span>
                  </div>
                </div>
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Est. Cost</p>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-primary)' }}>{itinerary.estimatedCostINR}</p>
                </div>
              </div>
              {itinerary.budgetBreakdown && (
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>🏨 Accommodation</p>
                    <p style={{ fontWeight: '600', color: 'white', margin: 0 }}>{itinerary.budgetBreakdown.accommodation}</p>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>🍽️ Food & Dining</p>
                    <p style={{ fontWeight: '600', color: 'white', margin: 0 }}>{itinerary.budgetBreakdown.food}</p>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>🚌 Transport</p>
                    <p style={{ fontWeight: '600', color: 'white', margin: 0 }}>{itinerary.budgetBreakdown.transport}</p>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>🎢 Activities</p>
                    <p style={{ fontWeight: '600', color: 'white', margin: 0 }}>{itinerary.budgetBreakdown.activities}</p>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {!itinerary.itinerary || itinerary.itinerary.length === 0 ? (
                  <div className="glass" style={{ padding: '32px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No day-wise activities found for this trip.</p>
                  </div>
                ) : (
                  itinerary.itinerary.map((day, idx) => (
                    <div key={idx} className="glass" style={{ padding: '32px' }}>
                      <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'var(--accent-gradient)', height: '32px', width: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>{day.dayNumber}</div>
                        Day {day.dayNumber}: {day.theme}
                      </h3>
                      <div style={{ borderLeft: '2px solid var(--border-color)', marginLeft: '15px', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {day.activities?.map((activity, actIdx) => (
                          <div key={actIdx} style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '-30px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontWeight: '600' }}>{activity.time}</span>
                                  {activity.travelTimeFromPrevious && (
                                    <span style={{ fontSize: '0.75rem', background: 'rgba(255,176,32,0.1)', color: '#ffb020', padding: '2px 6px', borderRadius: '4px' }}>🚗 {activity.travelTimeFromPrevious}</span>
                                  )}
                                </div>
                                <h4 style={{ margin: '4px 0' }}>{activity.activityName}</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{activity.description}</p>
                              </div>
                              {activity.mapLink && (
                                <a href={activity.mapLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', textDecoration: 'none', marginLeft: '16px', whiteSpace: 'nowrap' }}>
                                  <MapPin size={12} /> View Map
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass" style={{ padding: '24px' }}>
                  <h4 style={{ marginBottom: '16px' }}>🏨 Hotel Recommendations</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {!itinerary.hotels || itinerary.hotels.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>No hotels found for this budget.</p>
                    ) : (
                      itinerary.hotels.map((hotel, idx) => (
                        <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <p style={{ fontWeight: '600', margin: 0, fontSize: '1rem' }}>{hotel.name}</p>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>⭐ {hotel.rating}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0' }}>{hotel.description}</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '12px 0' }}>
                            {hotel.amenities?.map((amenity, aIdx) => (
                              <span key={aIdx} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>{amenity}</span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {hotel.locationCoordinates && (
                                <>Lat: {hotel.locationCoordinates[0].toFixed(4)}, Lng: {hotel.locationCoordinates[1].toFixed(4)}</>
                              )}
                            </p>
                            {hotel.mapLink && (
                              <a href={hotel.mapLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={12} /> Map
                              </a>
                            )}
                          </div>
                          <div style={{ marginTop: '12px' }}>
                            {hotel.bookingLink && (
                              <a href={hotel.bookingLink} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none', padding: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%' }}>
                                Book Now <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="glass" style={{ padding: '24px' }}>
                  <h4 style={{ marginBottom: '16px' }}>🍽️ Must Try Foods</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {itinerary.foodRecommendations?.map((food, idx) => (
                      <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <p style={{ fontWeight: '500', margin: '0 0 4px 0', color: 'var(--accent-secondary)' }}>{food.foodName}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 8px 0' }}>{food.description}</p>
                        {food.searchLink && (
                          <a href={food.searchLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                            Find Places Nearby <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {itinerary.famousSpots && itinerary.famousSpots.length > 0 && (
                  <div className="glass" style={{ padding: '24px' }}>
                    <h4 style={{ marginBottom: '16px' }}>📸 Famous Spots</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {itinerary.famousSpots.map((spot, idx) => (
                        <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                          <p style={{ fontWeight: '500', margin: '0 0 4px 0', color: 'var(--accent-primary)' }}>{spot.spotName}</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 8px 0' }}>{spot.description}</p>
                          {spot.searchLink && (
                            <a href={spot.searchLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: 'var(--accent-secondary)', textDecoration: 'none' }}>
                              View on Map <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {itinerary.travelTips && (
                  <div className="glass" style={{ padding: '24px' }}>
                    <h4 style={{ marginBottom: '16px' }}>💡 Travel Tips</h4>
                    <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {itinerary.travelTips.map((tip, idx) => (
                        <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {itinerary.seasonalEvents && itinerary.seasonalEvents.length > 0 && (
                  <div className="glass" style={{ padding: '24px' }}>
                    <h4 style={{ marginBottom: '16px' }}>🎉 Seasonal Events</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {itinerary.seasonalEvents.map((event, idx) => (
                        <div key={idx} style={{ padding: '12px', background: 'rgba(236, 72, 153, 0.05)', borderRadius: '8px', border: '1px solid rgba(236, 72, 153, 0.1)' }}>
                          <p style={{ fontWeight: '600', margin: '0 0 4px 0', color: '#ec4899', fontSize: '0.9rem' }}>{event.eventName}</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{event.description}</p>
                          {event.dateRange && <p style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', marginTop: '4px', fontWeight: '500' }}>📅 {event.dateRange}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {itinerary.hiddenGems && itinerary.hiddenGems.length > 0 && (
                  <div className="glass" style={{ padding: '24px' }}>
                    <h4 style={{ marginBottom: '16px' }}>💎 Hidden Gems</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {itinerary.hiddenGems.map((gem, idx) => (
                        <div key={idx} style={{ padding: '12px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
                          <p style={{ fontWeight: '600', margin: '0 0 4px 0', color: '#22c55e', fontSize: '0.9rem' }}>{gem.name}</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0' }}>{gem.description}</p>
                          <a href={gem.mapLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} /> View on Map
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Floating Chat Assistant */}
        {view === 'itinerary' && itinerary && (
          <div className="no-print" style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px' }}>
            {isChatOpen ? (
              <div className="glass" style={{ width: '350px', height: '450px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ padding: '16px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MessageCircle size={20} />
                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>AI Travel Agent</h4>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                    <History size={18} style={{ transform: 'rotate(90deg)' }} /> {/* Using history icon rotated as a minimize dash or just a button */}
                  </button>
                </div>
                <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {chatHistory.map((chat, idx) => (
                    <div key={idx} style={{ alignSelf: chat.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem', background: chat.role === 'user' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', color: chat.role === 'user' ? 'white' : 'inherit', border: chat.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                      {chat.message}
                    </div>
                  ))}
                  {isRefining && (
                    <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', gap: '4px' }}>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-secondary)', animation: 'bounce 0.6s infinite alternate' }}></div>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-secondary)', animation: 'bounce 0.6s infinite alternate 0.2s' }}></div>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-secondary)', animation: 'bounce 0.6s infinite alternate 0.4s' }}></div>
                    </div>
                  )}
                </div>
                <form onSubmit={refineItinerary} style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="input-glass"
                    style={{ padding: '8px 12px', fontSize: '0.85rem', height: '40px' }}
                    placeholder="e.g., Add a beach day..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '0 12px', height: '40px' }} disabled={isRefining}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setIsChatOpen(true)}
                className="btn-primary"
                style={{ width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(139, 92, 246, 0.4)' }}
              >
                <MessageCircle size={30} />
              </button>
            )}
            <style>{`
                @keyframes bounce { to { transform: translateY(-4px); } }
                @media print {
                  .no-print { display: none !important; }
                  body { background: white !important; color: black !important; }
                  .glass { background: none !important; border: 1px solid #ccc !important; box-shadow: none !important; color: black !important; }
                  .text-gradient { background: none !important; -webkit-text-fill-color: black !important; color: black !important; }
                  a { text-decoration: underline !important; color: blue !important; }
                }
              `}</style>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
