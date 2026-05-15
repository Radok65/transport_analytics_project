'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

interface User {
    username: string;
    roles: string[];
    role?: string;
    avatarUrl?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkUserStatus = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/auth/me');
                setUser(response.data);
            } catch {
                console.log("Пользователь не авторизован");
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkUserStatus();
    }, []);

    const login = async (username: string, password: string) => {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        await axios.post('http://localhost:8080/api/auth/login', params);

        const response = await axios.get('http://localhost:8080/api/auth/me');
        setUser(response.data);
    };

    const register = async (username: string, password: string) => {
        await axios.post('http://localhost:8080/api/auth/register', { username, password });
    };

    const logout = async () => {
        await axios.post('http://localhost:8080/api/auth/logout');
        setUser(null);
    };

    const loginWithGoogle = () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    };

    const authValues = { user, isLoading, login, register, logout, loginWithGoogle };

    return (
        <AuthContext.Provider value={authValues}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth должен использоваться внутри AuthProvider');
    }
    return context;
};