import { getAuthTokens } from "../AuthSlice/AuthSlice.tsx";
import {create} from "zustand/react";
import axios from "axios";
const API_BASE_URL = '/api';

interface FileState{
    fileContent: string | null;
    loading: boolean;
    error: string | null;
    
    readFile: (relativePath: string) => Promise<void>;
    updateFile: (relativePath: string, newContent: string) => Promise<void>;
}

export const useFileStore = create<FileState>((set) => ({
    fileContent: null,
    loading: false,
    error: null,
    
    readFile: async (relativePath: string) => {
        set({ loading: true, error: null });
        // console.log("relativePath: ", relativePath)
        try{
            const tokens = getAuthTokens();
            const res = await axios.get(
                `${API_BASE_URL}/File/Get-File?relativePath=${encodeURIComponent(relativePath)}`,
                {
                    headers:{
                        "X-API-KEY": tokens?.apiKey ?? "",
                        Authorization: `Bearer ${tokens?.jwtToken ?? ""}`,
                        Accept: "*/*",
                    },
                }
            );
            // console.log("Path: ", res)
            set({ fileContent: res.data, loading: false });
        }
        catch (err: any) {
            set({
                error: err.response?.data?.error ?? err.message,
                loading: false,
            });
        }
    },
    updateFile: async (relativePath: string, newContent: string) => {
        set({ loading: true, error: null });

        try {
            const tokens = getAuthTokens();

            await axios.patch(
                `${API_BASE_URL}/File/Update-File?relativePath=${encodeURIComponent(relativePath)}&newContent=${encodeURIComponent(newContent)}`,
                {},
                {
                    headers: {
                        "X-API-KEY": tokens?.apiKey ?? "",
                        Authorization: `Bearer ${tokens?.jwtToken ?? ""}`,
                        Accept: "*/*",
                    },
                }
            );

            set({ loading: false });
        }
        catch (err: any) {
            set({
                error: err.response?.data?.error ?? err.message,
                loading: false,
            });
        }
    },
}))