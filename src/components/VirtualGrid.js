import React, { useRef, useState, useCallback, useEffect } from 'react';

const ROW_HEIGHT = 52;
const OVERSCAN = 5;
const COLUMNS = [
    { key: 'id', label: 'ID', width: 70 },
    { key: 'name', label: 'Name', width: 200 },
    { key: 'email', label: 'Email', width: 240 },
    { key: 'department', label: 'Department', width: 150 },
    { key: 'salary', label: 'Salary', width: 120 },
    { key: 'city', label: 'City', width: 120 },
    { key: 'joinDate', label: 'Join Date', width: 130 },
];

function useVirtualScroller(totalRows, containerHeight) {
    const [scrollTop, setScrollTop] = useState(0);

    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + 2 * OVERSCAN;
    const endIndex = Math.min(totalRows - 1, startIndex + visibleCount);

    return { startIndex, endIndex, scrollTop, setScrollTop, totalHeight: totalRows * ROW_HEIGHT };
}

function getNestedValue(obj, key) {
    return obj[key] ?? obj[key.toLowerCase()] ?? obj[key.toUpperCase()] ?? '';
}

function formatSalary(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return val;
    return '₹' + n.toLocaleString('en-IN');
}

export default function VirtualGrid({ data, onRowClick }) {
    const containerRef = useRef(null);
    const [containerHeight, setContainerHeight] = useState(500);
    const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc' });
    const [search, setSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(entries => {
            for (const entry of entries) setContainerHeight(entry.contentRect.height);
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    const filtered = React.useMemo(() => {
        if (!searchQuery.trim()) return data;
        const q = searchQuery.toLowerCase();
        return data.filter(row =>
            COLUMNS.some(col => String(getNestedValue(row, col.key)).toLowerCase().includes(q))
        );
    }, [data, searchQuery]);

    const sorted = React.useMemo(() => {
        if (!sortConfig.key) return filtered;
        return [...filtered].sort((a, b) => {
            const av = getNestedValue(a, sortConfig.key);
            const bv = getNestedValue(b, sortConfig.key);
            const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
            return sortConfig.dir === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sortConfig]);

    const { startIndex, endIndex, setScrollTop, totalHeight } = useVirtualScroller(sorted.length, containerHeight);

    const handleScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, [setScrollTop]);

    const handleColumnSort = (key) => {
        setSortConfig(prev => ({
            key,
            dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleSearch = (e) => setSearch(e.target.value);
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchQuery(search);
    };

    const visibleRows = sorted.slice(startIndex, endIndex + 1);
    const offsetY = startIndex * ROW_HEIGHT;

    const DEPT_COLORS = {
        Engineering: 'bg-blue-500/20 text-blue-300',
        Marketing: 'bg-pink-500/20 text-pink-300',
        Finance: 'bg-green-500/20 text-green-300',
        HR: 'bg-purple-500/20 text-purple-300',
        Sales: 'bg-orange-500/20 text-orange-300',
        Operations: 'bg-yellow-500/20 text-yellow-300',
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                    <div className="relative">
                        <input
                            id="grid-search-input"
                            type="text"
                            placeholder="Search employees…"
                            value={search}
                            onChange={handleSearch}
                            className="input-field pl-10 py-2 w-64"
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button id="grid-search-btn" type="submit" className="btn-ghost text-sm px-3 py-2">Search</button>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => { setSearch(''); setSearchQuery(''); }}
                            className="text-gray-500 hover:text-red-400 transition-colors text-sm"
                        >
                            Clear
                        </button>
                    )}
                </form>
                <div className="text-sm text-gray-400">
                    {sorted.length.toLocaleString()} records
                </div>
            </div>

            <div className="glass-card flex flex-col flex-1 overflow-hidden">
                <div className="flex border-b border-white/10 bg-dark-700/60 rounded-t-2xl flex-shrink-0">
                    {COLUMNS.map(col => (
                        <button
                            key={col.key}
                            onClick={() => handleColumnSort(col.key)}
                            style={{ width: col.width, minWidth: col.width }}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider
                         hover:text-brand-300 hover:bg-white/5 transition-colors flex items-center gap-1 flex-shrink-0"
                        >
                            {col.label}
                            {sortConfig.key === col.key && (
                                <span className="text-brand-400">{sortConfig.dir === 'asc' ? '↑' : '↓'}</span>
                            )}
                        </button>
                    ))}
                    <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0 w-24">
                        Action
                    </div>
                </div>

                <div
                    ref={containerRef}
                    className="virtual-scroller flex-1"
                    onScroll={handleScroll}
                >
                    <div style={{ height: totalHeight, position: 'relative' }}>
                        <div style={{ transform: `translateY(${offsetY}px)` }}>
                            {visibleRows.map((row, i) => {
                                const dept = getNestedValue(row, 'department');
                                const deptClass = DEPT_COLORS[dept] || 'bg-gray-500/20 text-gray-300';
                                const isEven = (startIndex + i) % 2 === 0;
                                return (
                                    <div
                                        key={row.id || startIndex + i}
                                        className={`flex items-center border-b border-white/5 cursor-pointer
                      transition-colors duration-100
                      ${isEven ? 'bg-transparent' : 'bg-white/[0.02]'}
                      hover:bg-brand-600/10`}
                                        style={{ height: ROW_HEIGHT }}
                                        onClick={() => onRowClick && onRowClick(row)}
                                    >
                                        {COLUMNS.map(col => {
                                            let val = getNestedValue(row, col.key);
                                            if (col.key === 'salary') val = formatSalary(val);
                                            return (
                                                <div
                                                    key={col.key}
                                                    style={{ width: col.width, minWidth: col.width }}
                                                    className="px-4 text-sm text-gray-300 truncate flex-shrink-0"
                                                >
                                                    {col.key === 'department' ? (
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${deptClass}`}>
                                                            {val}
                                                        </span>
                                                    ) : col.key === 'name' ? (
                                                        <span className="font-medium text-white">{val}</span>
                                                    ) : String(val)}
                                                </div>
                                            );
                                        })}
                                        <div className="px-4 flex-shrink-0 w-24">
                                            <button
                                                id={`view-details-btn-${row.id || startIndex + i}`}
                                                onClick={e => { e.stopPropagation(); onRowClick && onRowClick(row); }}
                                                className="text-xs text-brand-400 hover:text-brand-300 border border-brand-500/30
                                    hover:border-brand-400/60 px-2 py-1 rounded-lg transition-all"
                                            >
                                                Details
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
