const fs = require('fs');
const path = 'd:/ai trip planner/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

// Use regex to match the block regardless of whitespace
const targetRegex = /<h4 style=\{\{ marginBottom: '16px' \}\}>🏨 Hotel Links<\/h4>\s+<div style=\{\{ display: 'flex', flexDirection: 'column', gap: '16px' \}\}>\s+\{itinerary\.hotelRecommendations\?\.map\(\(hotel, idx\) => \(\s+<div key=\{idx\} style=\{\{ padding: '16px', background: 'rgba\(255,255,255,0\.05\)', borderRadius: '8px' \}\}>\s+<p style=\{\{ fontWeight: '500', margin: '0 0 4px 0' \}\}>\{hotel\.name\}<\/p>\s+<span style=\{\{ fontSize: '0\.8rem', background: 'var\(--accent-gradient\)', padding: '2px 8px', borderRadius: '4px', color: 'white' \}\}>\{hotel\.type\}<\/span>\s+<p style=\{\{ fontSize: '0\.8rem', color: 'var\(--text-secondary\)', margin: '8px 0' \}\}>\{hotel\.description\}<\/p>\s+\{hotel\.bookingLink && \(\s+<a href=\{hotel\.bookingLink\} target="_blank" rel="noopener noreferrer" style=\{\{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0\.9rem', color: 'var\(--accent-primary\)', textDecoration: 'none', marginTop: '12px' \}\}>\s+Search on Google Maps <ExternalLink size=\{14\}\/>\s+<\/a>\s+\)\}\s+<\/div>\s+\)\)\}\s+<\/div>/;

const replacement = `<h4 style={{ marginBottom: '16px' }}>🏨 Hotel Links</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(path, content);
  console.log('Successfully updated App.jsx with regex');
} else {
  console.log('Regex did not match');
}
