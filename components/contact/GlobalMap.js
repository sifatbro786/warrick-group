/* ==========================================================================
   GlobalMap — schematic world map, ported from ContactPage.jsx.

   Equirectangular projection on a 360 × 180 viewBox, so x = lng + 180 and
   y = 90 − lat with no scaling term. Markers come from the Office records:
   add an office in the dashboard and a pin appears here.
   ========================================================================== */
const projectX = (lng) => lng + 180;
const projectY = (lat) => 90 - lat;

const MERIDIANS = Array.from({ length: 11 }, (_, index) => (index + 1) * 30);
const PARALLELS = Array.from({ length: 5 }, (_, index) => (index + 1) * 30);

export default function GlobalMap({ locations, originKey }) {
    const origin = locations.find((location) => location.key === originKey);
    const patternId = "global-map-dots";

    return (
        <div className="bg-royal-dark p-6 sm:p-8">
            <svg
                viewBox="0 0 360 180"
                role="img"
                aria-label={`Schematic world map plotting ${locations.map((location) => location.city).join(", ")}`}
                className="h-auto w-full"
            >
                <defs>
                    <pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r="0.45" fill="rgb(255 255 255 / 0.10)" />
                    </pattern>
                </defs>

                {/* Dot matrix ground */}
                <rect width="360" height="180" fill={`url(#${patternId})`} />

                {/* Graticule */}
                <g stroke="rgb(255 255 255 / 0.07)" strokeWidth="0.4">
                    {MERIDIANS.map((lngLine) => (
                        <line key={`m-${lngLine}`} x1={lngLine} y1="0" x2={lngLine} y2="180" />
                    ))}
                    {PARALLELS.map((latLine) => (
                        <line key={`p-${latLine}`} x1="0" y1={latLine} x2="360" y2={latLine} />
                    ))}
                </g>

                {/* Equator and prime meridian, one step brighter */}
                <g stroke="rgb(255 255 255 / 0.14)" strokeWidth="0.5">
                    <line x1="0" y1="90" x2="360" y2="90" />
                    <line x1="180" y1="0" x2="180" y2="180" />
                </g>

                {/* Reporting lines from the head office, lifted with a quadratic
                    control point so overlapping routes stay legible. */}
                {origin
                    ? locations
                          .filter((location) => location.key !== originKey)
                          .map((location) => {
                              const x1 = projectX(origin.coordinates.lng);
                              const y1 = projectY(origin.coordinates.lat);
                              const x2 = projectX(location.coordinates.lng);
                              const y2 = projectY(location.coordinates.lat);
                              const midX = (x1 + x2) / 2;
                              const midY = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.18;
                              return (
                                  <path
                                      key={`arc-${location.key}`}
                                      d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                                      fill="none"
                                      stroke="var(--color-gold)"
                                      strokeOpacity="0.28"
                                      strokeWidth="0.5"
                                  />
                              );
                          })
                    : null}

                {/* Markers */}
                {locations.map((location) => {
                    const x = projectX(location.coordinates.lng);
                    const y = projectY(location.coordinates.lat);
                    const isOrigin = location.key === originKey;
                    return (
                        <g key={location.key}>
                            <circle
                                cx={x}
                                cy={y}
                                r={isOrigin ? 5 : 4}
                                fill="none"
                                stroke="var(--color-gold)"
                                strokeOpacity={isOrigin ? 0.55 : 0.3}
                                strokeWidth="0.5"
                            />
                            <circle cx={x} cy={y} r={isOrigin ? 1.8 : 1.3} fill="var(--color-gold)" />
                            <text
                                x={x + 8}
                                y={y + 1.8}
                                fill="rgb(255 255 255 / 0.72)"
                                fontSize="5"
                                letterSpacing="0.6"
                                style={{ fontFamily: "var(--font-display)" }}
                            >
                                {location.city.toUpperCase()}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
