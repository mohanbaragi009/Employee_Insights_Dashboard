import React, { useMemo, useState } from 'react';
import { useEmployee } from '../context/EmployeeContext';

function getVal(obj, key) {
    return obj[key] ?? obj[key.toLowerCase()] ?? obj[key.toUpperCase()] ?? '';
}

function SalaryPerCityChart({ employees }) {
    const [hovered, setHovered] = useState(null);

    const cityData = useMemo(() => {
        const map = {};
        employees.forEach(emp => {
            const city = String(getVal(emp, 'city') || 'Unknown').trim();
            const salary = parseFloat(getVal(emp, 'salary'));
            if (!isNaN(salary)) {
                if (!map[city]) map[city] = { total: 0, count: 0, min: salary, max: salary };
                map[city].total += salary;
                map[city].count += 1;
                map[city].min = Math.min(map[city].min, salary);
                map[city].max = Math.max(map[city].max, salary);
            }
        });
        return Object.entries(map)
            .map(([city, d]) => ({ city, avg: Math.round(d.total / d.count), count: d.count, min: d.min, max: d.max }))
            .sort((a, b) => b.avg - a.avg);
    }, [employees]);

    if (!cityData.length) return <p className="text-gray-500 text-sm">No salary data.</p>;

    const W = 580, ROW_H = 42, LABEL_W = 100, BAR_AREA = W - LABEL_W - 80;
    const maxAvg = Math.max(...cityData.map(d => d.avg), 1);
    const H = cityData.length * ROW_H + 50;

    const CITY_COLORS = {
        Bangalore: '#6366f1', Mumbai: '#8b5cf6', Delhi: '#06b6d4',
        Chennai: '#10b981', Hyderabad: '#f59e0b', Pune: '#ef4444', Kolkata: '#ec4899',
    };

    const fmt = (v) => '₹' + Math.round(v).toLocaleString('en-IN');

    return (
        <div className="relative">
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full"
                aria-label="Average salary per city bar chart"
            >
                <defs>
                    {cityData.map((d, i) => {
                        const color = CITY_COLORS[d.city] || '#6366f1';
                        const [r, g, b] = [
                            parseInt(color.slice(1, 3), 16),
                            parseInt(color.slice(3, 5), 16),
                            parseInt(color.slice(5, 7), 16),
                        ];
                        return (
                            <linearGradient key={i} id={`cg${i}`} x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor={`rgba(${r},${g},${b},0.85)`} />
                                <stop offset="100%" stopColor={`rgba(${r},${g},${b},0.45)`} />
                            </linearGradient>
                        );
                    })}
                </defs>

                <text x={LABEL_W} y={18} fill="#6b7280" fontSize="11" fontWeight="600">Avg Salary →</text>
                <text x={W - 5} y={18} fill="#6b7280" fontSize="11" textAnchor="end">Count</text>

                {cityData.map((d, i) => {
                    const barW = (d.avg / maxAvg) * BAR_AREA;
                    const y = 30 + i * ROW_H;
                    const isHov = hovered === i;
                    const color = CITY_COLORS[d.city] || '#6366f1';

                    return (
                        <g
                            key={d.city}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                            style={{ cursor: 'pointer' }}
                        >
                            <rect x={0} y={y - 4} width={W} height={ROW_H - 2} rx="6"
                                fill={isHov ? 'rgba(255,255,255,0.04)' : 'transparent'} />

                            <text x={LABEL_W - 8} y={y + 16} textAnchor="end" fill={isHov ? '#e5e7eb' : '#9ca3af'}
                                fontSize="12" fontWeight={isHov ? '600' : '400'}>{d.city}</text>

                            <rect x={LABEL_W} y={y + 4} width={BAR_AREA} height={22} rx="4"
                                fill="rgba(255,255,255,0.04)" />

                            <rect x={LABEL_W} y={y + 4} width={barW} height={22} rx="4"
                                fill={`url(#cg${i})`}
                                style={{ transition: 'width 0.6s ease' }}
                            />

                            <circle cx={LABEL_W + barW} cy={y + 15} r={4} fill={color} />

                            <text
                                x={LABEL_W + barW + 8}
                                y={y + 19}
                                fill={isHov ? '#e5e7eb' : '#d1d5db'}
                                fontSize="11"
                                fontWeight="600"
                            >
                                {fmt(d.avg)}
                            </text>

                            <text x={W - 4} y={y + 19} textAnchor="end" fill="#6b7280" fontSize="11">
                                {d.count}
                            </text>

                            {isHov && (
                                <g>
                                    <rect x={LABEL_W} y={y - 32} width={220} height={28} rx="6"
                                        fill="#1a1a2e" stroke={color} strokeWidth="1" />
                                    <text x={LABEL_W + 10} y={y - 13} fill="#e5e7eb" fontSize="11">
                                        {d.city}: avg {fmt(d.avg)} | min {fmt(d.min)} | max {fmt(d.max)}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

function DepartmentDonutChart({ employees }) {
    const [hovered, setHovered] = useState(null);

    const { slices, total } = useMemo(() => {
        const counts = {};
        employees.forEach(e => {
            const d = getVal(e, 'department') || 'Unknown';
            counts[d] = (counts[d] || 0) + 1;
        });
        const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
        return { slices: Object.entries(counts).sort((a, b) => b[1] - a[1]), total };
    }, [employees]);

    const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];
    const R = 75, CX = 110, CY = 110, INNER_R = 46;

    let cumulAngle = -Math.PI / 2;
    const paths = slices.map(([dept, count], i) => {
        const angle = (count / total) * 2 * Math.PI;
        const startA = cumulAngle;
        const endA = cumulAngle + angle;
        cumulAngle = endA;
        const expand = hovered === i ? 6 : 0;
        const midA = (startA + endA) / 2;
        const ox = Math.cos(midA) * expand, oy = Math.sin(midA) * expand;
        const x1 = CX + ox + R * Math.cos(startA), y1 = CY + oy + R * Math.sin(startA);
        const x2 = CX + ox + R * Math.cos(endA), y2 = CY + oy + R * Math.sin(endA);
        const ix1 = CX + ox + INNER_R * Math.cos(startA), iy1 = CY + oy + INNER_R * Math.sin(startA);
        const ix2 = CX + ox + INNER_R * Math.cos(endA), iy2 = CY + oy + INNER_R * Math.sin(endA);
        const large = angle > Math.PI ? 1 : 0;
        const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}
               L ${ix2} ${iy2} A ${INNER_R} ${INNER_R} 0 ${large} 0 ${ix1} ${iy1} Z`;
        return { d, color: COLORS[i % COLORS.length], dept, count };
    });

    return (
        <div className="flex items-center gap-6 flex-wrap">
            <svg viewBox="0 0 220 220" className="w-52 h-52 flex-shrink-0">
                {paths.map((p, i) => (
                    <path key={i} d={p.d} fill={p.color}
                        opacity={hovered === null || hovered === i ? 0.9 : 0.45}
                        style={{ cursor: 'pointer', transition: 'opacity 0.2s, d 0.2s' }}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                    />
                ))}
                <text x={CX} y={CY - 8} textAnchor="middle" fill="#e5e7eb" fontSize="22" fontWeight="700">{total}</text>
                <text x={CX} y={CY + 12} textAnchor="middle" fill="#9ca3af" fontSize="10">employees</text>
                {hovered !== null && (
                    <>
                        <text x={CX} y={CY + 30} textAnchor="middle" fill={paths[hovered]?.color} fontSize="11" fontWeight="600">
                            {paths[hovered]?.dept}
                        </text>
                    </>
                )}
            </svg>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
                {paths.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm cursor-pointer"
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                        style={{ opacity: hovered === null || hovered === i ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: p.color }} />
                        <span className="text-gray-300 truncate flex-1">{p.dept}</span>
                        <span className="text-gray-500 text-xs tabular-nums">
                            {p.count} ({Math.round(p.count / total * 100)}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CityMap({ employees }) {
    const [tooltip, setTooltip] = useState(null);

    const cityStats = useMemo(() => {
        const map = {};
        employees.forEach(emp => {
            const city = String(getVal(emp, 'city') || '').trim();
            const salary = parseFloat(getVal(emp, 'salary'));
            if (city) {
                if (!map[city]) map[city] = { count: 0, totalSalary: 0, dist: { high: 0, med: 0, low: 0 } };
                map[city].count++;
                if (!isNaN(salary)) {
                    map[city].totalSalary += salary;
                    if (salary > 100000) map[city].dist.high++;
                    else if (salary > 50000) map[city].dist.med++;
                    else map[city].dist.low++;
                }
            }
        });
        return map;
    }, [employees]);

    const CITIES = {
        Bangalore: { x: 178, y: 338, lat: '12.97°N', lon: '77.59°E' },
        Mumbai: { x: 118, y: 262, lat: '19.07°N', lon: '72.87°E' },
        Delhi: { x: 175, y: 130, lat: '28.66°N', lon: '77.22°E' },
        Chennai: { x: 210, y: 352, lat: '13.08°N', lon: '80.27°E' },
        Hyderabad: { x: 185, y: 295, lat: '17.38°N', lon: '78.48°E' },
        Pune: { x: 133, y: 278, lat: '18.52°N', lon: '73.85°E' },
        Kolkata: { x: 268, y: 198, lat: '22.57°N', lon: '88.36°E' },
    };

    const allCounts = Object.values(cityStats).map(c => c.count);
    const maxCount = Math.max(...allCounts, 1);

    const INDIA_PATH = `M 188 32 L 205 28 L 228 38 L 255 52 L 272 65 L 290 78
    L 304 95 L 312 118 L 306 138 L 294 148 L 308 162 L 302 185
    L 288 205 L 278 218 L 300 232 L 284 252 L 272 276
    L 250 310 L 232 340 L 215 368 L 205 400 L 196 418
    L 186 400 L 176 370 L 160 342 L 144 312 L 124 290
    L 104 264 L 90 234 L 92 205 L 80 186 L 83 158
    L 96 134 L 106 108 L 122 88 L 138 72 L 155 58
    L 170 44 Z`;

    const fmt = v => '₹' + Math.round(v).toLocaleString('en-IN');

    return (
        <div className="relative">
            <svg viewBox="0 0 400 450" className="w-full" aria-label="Geospatial India employee map">
                <defs>
                    <radialGradient id="mapBg" cx="50%" cy="50%" r="60%">
                        <stop offset="0%" stopColor="#1f2b4d" />
                        <stop offset="100%" stopColor="#0f0f1a" />
                    </radialGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                <rect width="400" height="450" fill="url(#mapBg)" rx="14" />

                {[80, 160, 240, 320].map(x => (
                    <line key={x} x1={x} y1={20} x2={x} y2={430}
                        stroke="rgba(255,255,255,0.025)" strokeWidth="1" strokeDasharray="4 6" />
                ))}
                {[90, 180, 270, 360].map(y => (
                    <line key={y} x1={20} y1={y} x2={380} y2={y}
                        stroke="rgba(255,255,255,0.025)" strokeWidth="1" strokeDasharray="4 6" />
                ))}

                <path d={INDIA_PATH}
                    fill="rgba(99,102,241,0.07)"
                    stroke="rgba(99,102,241,0.3)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />

                {Object.entries(CITIES).map(([city, pos]) => {
                    const stat = cityStats[city] || { count: 0, totalSalary: 0 };
                    const r = stat.count > 0
                        ? Math.max(7, Math.min(24, 7 + (stat.count / maxCount) * 17))
                        : 5;
                    const avgSalary = stat.count > 0 ? stat.totalSalary / stat.count : 0;
                    const isHov = tooltip?.city === city;

                    return (
                        <g
                            key={city}
                            onMouseEnter={() => setTooltip({ city, ...pos, ...stat, avgSalary })}
                            onMouseLeave={() => setTooltip(null)}
                            style={{ cursor: 'pointer' }}
                        >
                            {stat.count > 0 && (
                                <circle cx={pos.x} cy={pos.y} r={r + 7}
                                    fill="none"
                                    stroke={isHov ? '#a5b4fc' : '#6366f1'}
                                    strokeWidth="1.5"
                                    opacity="0.3"
                                    className="animate-ping-slow"
                                    style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                                />
                            )}
                            <circle
                                cx={pos.x} cy={pos.y} r={r}
                                fill={stat.count > 0 ? '#6366f1' : '#374151'}
                                opacity={isHov ? 1 : stat.count > 0 ? 0.85 : 0.4}
                                filter={isHov ? 'url(#glow)' : undefined}
                                style={{ transition: 'all 0.2s' }}
                            />
                            {stat.count > 0 && (
                                <text x={pos.x} y={pos.y + 4} textAnchor="middle"
                                    fill="white" fontSize="8" fontWeight="700">{stat.count}</text>
                            )}
                            <text x={pos.x + r + 6} y={pos.y + 4}
                                fill={isHov ? '#e5e7eb' : '#9ca3af'} fontSize="10"
                                fontWeight={isHov ? '600' : '400'}>
                                {city}
                            </text>
                        </g>
                    );
                })}

                {tooltip && tooltip.count > 0 && (
                    <g>
                        <rect
                            x={Math.min(tooltip.x + 14, 210)}
                            y={tooltip.y - 75}
                            width="180" height="70" rx="10"
                            fill="#0f0f1a"
                            stroke="#6366f1" strokeWidth="1.5"
                            style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))' }}
                        />
                        <text x={Math.min(tooltip.x + 26, 222)} y={tooltip.y - 52}
                            fill="#a5b4fc" fontSize="13" fontWeight="700">{tooltip.city}</text>
                        <text x={Math.min(tooltip.x + 26, 222)} y={tooltip.y - 35}
                            fill="#9ca3af" fontSize="10">
                            Avg {fmt(tooltip.avgSalary)} · {tooltip.count} staff
                        </text>
                        <g transform={`translate(${Math.min(tooltip.x + 26, 222)}, ${tooltip.y - 22})`}>
                            <rect width="45" height="14" rx="4" fill="#312e81" opacity="0.6" />
                            <text x="5" y="10" fill="#a5b4fc" fontSize="9" fontWeight="600">H: {tooltip.dist.high}</text>

                            <rect x="52" width="45" height="14" rx="4" fill="#1e3a8a" opacity="0.6" />
                            <text x="57" y="10" fill="#93c5fd" fontSize="9" fontWeight="600">M: {tooltip.dist.med}</text>

                            <rect x="104" width="45" height="14" rx="4" fill="#1e1b4b" opacity="0.6" />
                            <text x="109" y="10" fill="#c7d2fe" fontSize="9" fontWeight="600">L: {tooltip.dist.low}</text>
                        </g>
                    </g>
                )}

                <text x="370" y="45" fill="#6b7280" fontSize="14" textAnchor="middle">N</text>
                <line x1="370" y1="48" x2="370" y2="58" stroke="#6b7280" strokeWidth="1" />
            </svg>

            <p className="text-xs mt-2 text-center" style={{ color: '#6b7280' }}>
                City positions hand-mapped from actual lat/lon coordinates to SVG viewBox
            </p>
        </div>
    );
}

function StatCards({ employees }) {
    const stats = useMemo(() => {
        if (!employees.length) return {};
        const salaries = employees.map(e => parseFloat(getVal(e, 'salary'))).filter(n => !isNaN(n));
        const avg = salaries.length ? salaries.reduce((a, b) => a + b, 0) / salaries.length : 0;
        const max = salaries.length ? Math.max(...salaries) : 0;
        const depts = new Set(employees.map(e => getVal(e, 'department'))).size;
        const cities = new Set(employees.map(e => getVal(e, 'city'))).size;
        return { avg, max, depts, cities };
    }, [employees]);

    const fmt = v => '₹' + Math.round(v).toLocaleString('en-IN');

    const cards = [
        { label: 'Total Employees', value: employees.length.toLocaleString(), icon: '👥', from: '#312e81', to: '#4f46e5' },
        { label: 'Avg. Salary', value: stats.avg ? fmt(stats.avg) : '—', icon: '💰', from: '#064e3b', to: '#059669' },
        { label: 'Departments', value: stats.depts || '—', icon: '🏢', from: '#4c1d95', to: '#7c3aed' },
        { label: 'Cities Covered', value: stats.cities || '—', icon: '🗺️', from: '#164e63', to: '#0891b2' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(card => (
                <div key={card.label} className="glass-card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${card.from}, ${card.to})` }}>
                        {card.icon}
                    </div>
                    <div>
                        <p className="text-xs" style={{ color: '#9ca3af' }}>{card.label}</p>
                        <p className="font-bold text-lg text-white">{card.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function AnalyticsScreen() {
    const { employees } = useEmployee();

    if (!employees.length) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="text-center" style={{ color: '#6b7280' }}>
                    <p className="text-lg font-semibold text-white">No data loaded</p>
                    <p className="text-sm mt-1">Go to the Employees tab first and let it load.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-bold text-white">Analytics Dashboard</h1>
                <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
                    Pure SVG visualizations — zero external charting or mapping libraries
                </p>
            </div>

            <StatCards employees={employees} />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="font-semibold text-white mb-1">Salary Distribution per City</h3>
                    <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                        Average salary per city — raw SVG horizontal bars
                    </p>
                    <SalaryPerCityChart employees={employees} />
                </div>

                <div className="glass-card p-6">
                    <h3 className="font-semibold text-white mb-1">Department Breakdown</h3>
                    <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                        Hover slices to highlight
                    </p>
                    <DepartmentDonutChart employees={employees} />
                </div>
            </div>

            <div className="glass-card p-6">
                <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-white">Geospatial City Map</h3>
                    <span className="text-xs px-2 py-1 rounded-full"
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                        No Leaflet / Mapbox
                    </span>
                </div>
                <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                    Dot size = employee count · Hover for avg salary
                </p>
                <div className="flex justify-center">
                    <div className="w-full max-w-md">
                        <CityMap employees={employees} />
                    </div>
                </div>
            </div>
        </div>
    );
}
