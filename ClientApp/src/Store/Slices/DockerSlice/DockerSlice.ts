
import { create } from "zustand/react";
import axios from "axios";
import { getAuthTokens } from "../AuthSlice/AuthSlice.tsx";

const API_BASE_URL = "/api/Docker";

interface DockerActionState {
    loading: boolean;
    error: string | null;
    startContainer: (formData: FormData) => Promise<any>;
    stopContainer: (formData: FormData) => Promise<any>;
    loadImage: (formData: FormData) => Promise<any>;
    removeImage: (formData: FormData) => Promise<any>;
    pullImage: (FormData: FormData) => Promise<any>;
}

export const useDockerStore = create<DockerActionState>((set) => ({
    loading: false,
    error: null,

    startContainer: async (formData) => {
        set({ loading: true, error: null });
        try {
            const tokens = getAuthTokens();
            const res = await axios.post(`${API_BASE_URL}/Start-Container`, formData, {
                headers: {
                    "X-API-KEY": tokens?.apiKey ?? "",
                    Authorization: `Bearer ${tokens?.jwtToken ?? ""}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            set({ error: err.response?.data?.error ?? err.message, loading: false });
            throw err;
        }
    },

    stopContainer: async (formData) => {
        set({ loading: true, error: null });
        try {
            const tokens = getAuthTokens();
            const res = await axios.post(`${API_BASE_URL}/Stop-Container`, formData, {
                headers: {
                    "X-API-KEY": tokens?.apiKey ?? "",
                    Authorization: `Bearer ${tokens?.jwtToken ?? ""}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            set({ error: err.response?.data?.error ?? err.message, loading: false });
            throw err;
        }
    },

    loadImage: async (formData) => {
        set({ loading: true, error: null });
        try {
            const tokens = getAuthTokens();
            const res = await axios.post(`${API_BASE_URL}/Load-Image`, formData, {
                headers: {
                    "X-API-KEY": tokens?.apiKey ?? "",
                    Authorization: `Bearer ${tokens?.jwtToken ?? ""}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            set({ error: err.response?.data?.error ?? err.message, loading: false });
            throw err;
        }
    },

    removeImage: async (formData) => {
        set({ loading: true, error: null });
        try {
            const tokens = getAuthTokens();
            const res = await axios.post(`${API_BASE_URL}/Remove-Image`, formData, {
                headers: {
                    "X-API-KEY": tokens?.apiKey ?? "",
                    Authorization: `Bearer ${tokens?.jwtToken ?? ""}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            set({ error: err.response?.data?.error ?? err.message, loading: false });
            throw err;
        }
    },
    pullImage: async (formData) => {
        set({ loading: true, error: null });
        try {
            const tokens = getAuthTokens();
            const res = await axios.post(`${API_BASE_URL}/Pull-Image`, formData, {
                headers: {
                    "X-API-KEY": tokens?.apiKey ?? "",
                    Authorization: `Bearer ${tokens?.jwtToken ?? ""}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            set({ loading: false });
            return res.data;
        } catch (err: any) {
            set({ error: err.response?.data?.error ?? err.message, loading: false });
            throw err;
        }
    },
}));
