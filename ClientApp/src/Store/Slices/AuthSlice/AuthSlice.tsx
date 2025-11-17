import {create} from "zustand/react";
export type AuthToken = {
  apiKey: string;
  jwtToken: string;
  role: string;
};
import axios from 'axios';

interface AuthState {
    token: AuthToken | null;
    user: string | null;
    loading: boolean;
    error: Error | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    
}

export const saveAuthTokens = (apiKey: string, jwtToken: string, role: string, expiresInSeconds: number) => {
    const now = Date.now();
    const expires = now + expiresInSeconds * 1000;
    
    const tokenData = {
        apiKey,
        jwtToken,
        role,
        expires
    };
    localStorage.setItem('authTokens', JSON.stringify(tokenData));
}

export const getAuthTokens = (): {apiKey: string, jwtToken: string} | null =>{
    const tokenData = localStorage.getItem('authTokens');
    if(!tokenData) return null;
    const {apiKey, jwtToken, expires} = JSON.parse(tokenData);
    if(Date.now() > expires) {
        localStorage.removeItem('authTokens');
        return null;
    }
    return {apiKey, jwtToken};
}

const API_BASE_URL = '/api'

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    loading: false,
    error: null,

    login: async (username: string, password: string): Promise<boolean> => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/Auth/login/password`,
                { username, password },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            const { apiKey, jwtToken, role } = response.data;
            set({ token: { apiKey, jwtToken, role } });
            saveAuthTokens(apiKey, jwtToken, role, 1800);
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    },

    logout: () => {
        set({ token: null });
        localStorage.removeItem('authTokens');
    },
}));