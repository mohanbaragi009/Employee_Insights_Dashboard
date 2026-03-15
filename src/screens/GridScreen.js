import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployee } from '../context/EmployeeContext';
import VirtualGrid from '../components/VirtualGrid';

export default function GridScreen() {
    const { employees, loading, error, fetchEmployees } = useEmployee();
    const navigate = useNavigate();

    useEffect(() => {
        if (employees.length === 0) fetchEmployees();
    }, [employees.length, fetchEmployees]);

    const handleRowClick = (emp) => {
        navigate(`/details/${emp.id}`, { state: { employee: emp } });
    };

    return (
        <div className="flex flex-col h-full gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Employee Records</h2>
                    <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>Virtualized high-performance grid — click any row to verify identity</p>
                </div>
                <button
                    id="refresh-grid-btn"
                    onClick={fetchEmployees}
                    disabled={loading}
                    className="btn-ghost flex items-center gap-2 text-sm"
                >
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loading ? 'Loading…' : 'Refresh'}
                </button>
            </div>

            {error && (
                <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-3"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="font-medium">API Error — using mock data</p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(248,113,113,0.7)' }}>{error}</p>
                    </div>
                </div>
            )}

            {loading && employees.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-t-indigo-500 rounded-full animate-spin"
                            style={{ borderColor: 'rgba(99,102,241,0.3)', borderTopColor: '#6366f1' }} />
                        <p className="text-sm" style={{ color: '#6b7280' }}>Loading employee data…</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 min-h-0">
                    <VirtualGrid data={employees} onRowClick={handleRowClick} />
                </div>
            )}
        </div>
    );
}
