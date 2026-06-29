const fs = require('fs');
const path = 'd:/ai trip planner/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

const targetRegex = /\{itinerary\.itinerary\?\.map\(\(day, idx\) => \(\s+<div key=\{idx\} className="glass" style=\{\{ padding: '32px' \}\}>\s+<h3 style=\{\{ fontSize: '1\.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' \}\}>\s+<div style=\{\{ background: 'var\(--accent-gradient\)', height: '32px', width: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' \}\}>\{day\.dayNumber\}<\/div>\s+Day \{day\.dayNumber\}: \{day\.theme\}\s+<\/h3>\s+<div style=\{\{ borderLeft: '2px solid var\(--border-color\)', marginLeft: '15px', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '24px' \}\}>\s+<div style=\{\{ position: 'relative' \}\}>\s+<div style=\{\{ position: 'absolute', left: '-30px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var\(--accent-primary\)' \}\}>\s+<\/div>\s+<h4 style=\{\{ color: 'var\(--accent-primary\)', marginBottom: '4px' \}\}>Morning<\/h4>\s+<p style=\{\{ color: 'var\(--text-secondary\)' \}\}>\{day\.morning\}<\/p>\s+<\/div>\s+<div style=\{\{ position: 'relative' \}\}>\s+<div style=\{\{ position: 'absolute', left: '-30px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var\(--accent-secondary\)' \}\}>\s+<\/div>\s+<h4 style=\{\{ color: 'var\(--accent-secondary\)', marginBottom: '4px' \}\}>Afternoon<\/h4>\s+<p style=\{\{ color: 'var\(--text-secondary\)' \}\}>\{day\.afternoon\}<\/p>\s+<\/div>\s+<div style=\{\{ position: 'relative' \}\}>\s+<div style=\{\{ position: 'absolute', left: '-30px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: '#ffb020' \}\}>\s+<\/div>\s+<h4 style=\{\{ color: '#ffb020', marginBottom: '4px' \}\}>Evening<\/h4>\s+<p style=\{\{ color: 'var\(--text-secondary\)' \}\}>\{day\.evening\}<\/p>\s+<\/div>\s+<\/div>\s+<\/div>\s+\)\)\}/;

const replacement = `{itinerary.itinerary?.map((day, idx) => (
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
                                {activity.map_link && (
                                  <a href={activity.map_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', textDecoration: 'none', marginLeft: '16px', whiteSpace: 'nowrap' }}>
                                    <MapPin size={12}/> View Map
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(path, content);
  console.log('Successfully updated itinerary in App.jsx');
} else {
  console.log('Regex did not match');
}
