import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const CREDENTIALS = { username: 'testuser', password: 'Test123' };
const SESSION_KEY = 'eid_session';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (_) {
                localStorage.removeItem(SESSION_KEY);
            }
        }
        setLoading(false);
    }, []);

    const login = (username, password) => {
        if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
            const session = { username, loginAt: Date.now() };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            setUser(session);
            return { success: true };
        }
        return { success: false, error: 'Invalid credentials. Use testuser / Test123' };
    };

    const logout = () => {
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
