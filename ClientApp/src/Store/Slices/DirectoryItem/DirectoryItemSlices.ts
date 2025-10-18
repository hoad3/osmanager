import type {DirectoryItem} from "../../../Interface/Model.tsx";
import {getAuthTokens} from "../AuthSlice/AuthSlice.tsx";
import axios from "axios";
import {create} from "zustand/react";

interface DirectoryState {
    items: DirectoryItem[];
    loading: boolean;
    error: string | null;
    scanRoot: () => Promise<void>;
    browsePath: (path: string) => Promise<void>;
}
const API_BASE_URL = '/api'

export const useDirectoryStore = create<DirectoryState>((set) => ({
    items: [],
    loading: false,
    error: null,

    scanRoot: async () => {
        set({ loading: true, error: null });
        try {
            const tokens = getAuthTokens();
            const res = await axios.get<DirectoryItem[]>(
                `${API_BASE_URL}/DirectoryScanner/scan`,
                {
                    headers: {
                        "X-API-KEY": tokens?.apiKey ?? "",
                        Authorization: `Bearer ${tokens?.jwtToken ?? ""}`,
                        Accept: "*/*",
                    },
                }
            );
            set({ items: res.data, loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    browsePath: async (path: string) => {
        set({ loading: true, error: null });
        try {
            const tokens = getAuthTokens();
            const res = await axios.get<DirectoryItem[]>(
                `${API_BASE_URL}/DirectoryScanner/browse?path=${encodeURIComponent(path)}`,
                {
                    headers: {
                        "X-API-KEY": tokens?.apiKey ?? "",
                        Authorization: `Bearer ${tokens?.jwtToken ?? ""}`,
                        Accept: "*/*",
                    },
                }
            );
            set({ items: res.data, loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },
}));