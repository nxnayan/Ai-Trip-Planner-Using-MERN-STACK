const fs = require('fs');
const path = 'd:/ai trip planner/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {itinerary.hotelRecommendations?.map((hotel, idx) => (
                            <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                              <p style={{ fontWeight: '500', margin: '0 0 4px 0' }}>{hotel.name}</p>
                              <span style={{ fontSize: '0.8rem', background: 'var(--accent-gradient)', padding: '2px 8px', borderRadius: '4px', color: 'white' }}>{hotel.type}</span>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '8px 0' }}>{hotel.description}</p>
                              {hotel.bookingLink && (
                                <a href={hotel.bookingLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: 'var(--accent-primary)', textDecoration: 'none', marginTop: '12px' }}>
                                  Search on Google Maps <ExternalLink size={14}/>
                                </a>
                              )}
                            </div>
                          ))}
                      </div>`;

const replacement = `                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {itinerary.hotelRecommendations?.map((hotel, idx) => {
                            const matchedHotel = hotels.find(h => 
                              h.name.toLowerCase().includes(hotel.name.toLowerCase()) || 
                              hotel.name.toLowerCase().includes(h.name.toLowerCase())
                            );
                            
                            return (
                              <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <p style={{ fontWeight: '500', margin: '0 0 4px 0' }}>{hotel.name}</p>
                                <span style={{ fontSize: '0.8rem', background: 'var(--accent-gradient)', padding: '2px 8px', borderRadius: '4px', color: 'white' }}>{hotel.type}</span>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '8px 0' }}>{hotel.description}</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                  {hotel.bookingLink && (
                                    <a href={hotel.bookingLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                                      Search on Google Maps <ExternalLink size={14}/>
                                    </a>
                                  )}
                                  {matchedHotel && (
                                    <button 
                                      className="btn-primary" 
                                      style={{ padding: '6px 12px', fontSize: '12px', width: 'fit-content' }}
                                      onClick={() => bookHotel(matchedHotel._id, matchedHotel.pricePerNight)}
                                    >
                                      Book in App (₹{matchedHotel.pricePerNight})
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content);
  console.log('Successfully updated App.jsx');
} else {
  console.log('Target not found');
  // Try with normalized whitespace
  const normalize = (s) => s.replace(/\s+/g, ' ').trim();
  const normalizedContent = normalize(content);
  const normalizedTarget = normalize(target);
  if (normalizedContent.includes(normalizedTarget)) {
      console.log('Found with normalized whitespace, but replacement might be tricky.');
  }
}
