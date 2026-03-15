import React, { createContext, useContext, useState, useCallback } from 'react';
import { generateMockEmployees } from '../utils/mockData';

const EmployeeContext = createContext(null);

export function EmployeeProvider({ children }) {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [auditImages, setAuditImages] = useState({});

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('https://backend.jotish.in/backend_dev/gettabledata.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'test', password: '123456' }),
            });
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            const data = await response.json();
            const arr = Array.isArray(data) ? data : (data.data || data.employees || []);
            setEmployees(arr.length ? arr : generateMockEmployees(300));
        } catch (err) {
            setError(err.message);
            setEmployees(generateMockEmployees(300));
        } finally {
            setLoading(false);
        }
    }, []);

    const saveAuditImage = useCallback((employeeId, blobUrl) => {
        setAuditImages(prev => ({ ...prev, [employeeId]: blobUrl }));
    }, []);

    return (
        <EmployeeContext.Provider value={{
            employees,
            loading,
            error,
            fetchEmployees,
            selectedEmployee,
            setSelectedEmployee,
            auditImages,
            saveAuditImage,
        }}>
            {children}
        </EmployeeContext.Provider>
    );
}

export const useEmployee = () => {
    const ctx = useContext(EmployeeContext);
    if (!ctx) throw new Error('useEmployee must be used within EmployeeProvider');
    return ctx;
};
