import { create } from "zustand/react";
import axios from "axios";
import {getAuthTokens} from "../AuthSlice/AuthSlice.tsx";

const API_BASE_URL = "/api";

interface UploadState {
    uploading: boolean;
    error: string | null;
    success: boolean;

    uploadFiles: (relativePath: string, files: File[]) => Promise<void>;
}

export const useUploadStore = create<UploadState>((set) => ({
    uploading: false,
    error: null,
    success: false,

    uploadFiles: async (relativePath: string, files: File[]) => {
        set({ uploading: true, error: null, success: false });

        try {
            const tokens = getAuthTokens(); 

            const formData = new FormData();
            files.forEach((file) => formData.append("files", file));

            await axios.post(`${API_BASE_URL}/Upload/upload?relativePath=${encodeURIComponent(relativePath)}`, formData, {
                headers: {
                    "X-API-KEY": tokens?.apiKey ?? "",
                    Authorization: `Bearer ${tokens?.jwtToken ?? ""}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            set({ success: true, uploading: false });
        } catch (err: any) {
            set({
                error: err.response?.data?.error ?? err.message,
                uploading: false,
                success: false,
            });
        }
    },
}));
