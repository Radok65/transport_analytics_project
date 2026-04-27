'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { analytics } from '@/lib/analyticsService';

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
                // СОХРАНЯЕМ В КЭШ ДЛЯ АНАЛИТИКИ
                localStorage.setItem('user', JSON.stringify(response.data));
            } catch {
                setUser(null);
                // УДАЛЯЕМ ИЗ КЭША ПРИ ОШИБКЕ
                localStorage.removeItem('user');
            } finally {
                setIsLoading(false);
            }
        };

        checkUserStatus();
    }, []);

    const login = async (username: string, password: string) => {
        const startTime = Date.now();
        try {
            const params = new URLSearchParams();
            params.append('username', username);
            params.append('password', password);

            await axios.post('http://localhost:8080/api/auth/login', params);

            const response = await axios.get('http://localhost:8080/api/auth/me');
            setUser(response.data);

            // СОХРАНЯЕМ В КЭШ ДЛЯ АНАЛИТИКИ ПОСЛЕ ЛОГИНА
            localStorage.setItem('user', JSON.stringify(response.data));

            const duration = Date.now() - startTime;
            analytics.trackEvent('Конверсия', 'auth_success', { auth_duration: duration });
        } catch (error: any) {
            analytics.trackEvent('Системные события', 'api_request_fail', {
                status_code: error.response?.status || 500,
                endpoint_path: '/api/auth/login'
            });
            throw error;
        }
    };

    const register = async (username: string, password: string) => {
        try {
            await axios.post('http://localhost:8080/api/auth/register', { username, password });
        } catch (error: any) {
            analytics.trackEvent('Системные события', 'api_request_fail', {
                status_code: error.response?.status || 500,
                endpoint_path: '/api/auth/register'
            });
            throw error;
        }
    };

    const logout = async () => {
        await axios.post('http://localhost:8080/api/auth/logout');
        setUser(null);
        // ОЧИЩАЕМ КЭШ ПРИ ВЫХОДЕ
        localStorage.removeItem('user');
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