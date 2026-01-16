import type {HistoryEntry} from "../../../Interface/Model.tsx";
import {getAuthTokens} from "../AuthSlice/AuthSlice.tsx";
import axios from "axios";
import {create} from "zustand/react";


const API_BASE_URL = "/api";

interface HistoryState {
    historyList: HistoryEntry[] | null;
    loading: boolean;
    error: string | null;

    fetchHistory: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set) => ({
    historyList: null,
    loading: false,
    error: null,

    fetchHistory: async () => {
        set({ loading: true, error: null });
        try {
            const tokens = getAuthTokens();
            const res = await axios.get<HistoryEntry[]>(
                `${API_BASE_URL}/GetHistory/GetHistory`,
                {
                    headers: {
                        "X-API-KEY": tokens?.apiKey ?? "",
                        Authorization: `Bearer ${tokens?.jwtToken ?? ""}`,
                        Accept: "application/json",
                    },
                }
            );

            set({ historyList: res.data, loading: false });
        } catch (err: any) {
            set({
                error: err.response?.data?.error ?? err.message,
                loading: false,
            });
        }
    },
}));