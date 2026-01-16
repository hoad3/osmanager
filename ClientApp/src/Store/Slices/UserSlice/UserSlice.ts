import type {UserForm} from "../../../Interface/Model.tsx";
import {create} from "zustand/react";
import {getAuthTokens} from "../AuthSlice/AuthSlice.tsx";
import axios from "axios";
const API_BASE_URL = '/api';
interface UserState {
    users: any[];
    loading: boolean;
    error: string | null;

    fetchUsers: () => Promise<void>;
    createUser: (form: UserForm) => Promise<void>;
    updateUser: (form: UserForm) => Promise<void>;
    deleteUser: (
        username: string,
        sshPrivateKeyFile: File,
        sshPrivateKeyPassphrase?: string,
        removeFromDockerGroup?: boolean,
        removeFromSudoGroup?: boolean,
        sshUsername?: string
    ) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
    users: [],
    loading: false,
    error: null,

    fetchUsers: async () => {
        set({ loading: true, error: null });
        try {
            const tokens = getAuthTokens();
            const res = await axios.get(`${API_BASE_URL}/User/GetUser`, {
                headers: {
                    "X-API-KEY": tokens?.apiKey ?? "",
                    Authorization: `Bearer ${tokens?.jwtToken ?? ""}`,
                    Accept: "*/*",
                },
            });
            set({ users: res.data, loading: false });
        } catch (err: any) {
            set({ error: err.response?.data?.error ?? err.message, loading: false });
        }
    },

    createUser: async (form: UserForm) => {
        set({ loading: true, error: null });
        try {
            const tokens = getAuthTokens();
            const formData = new FormData();
            formData.append("Username", form.username);
            formData.append("Password", form.password ?? "");
            formData.append("IsRoot", String(form.isRoot ?? false));
            formData.append("CanUseDocker", String(form.canUseDocker ?? false));
            formData.append("CanUseOSManager", String(form.CanUseOSManager ?? false));
            if (form.allowedDirectories) {
                form.allowedDirectories.forEach(dir => formData.append("AllowedDirectories", dir));
            }
            if (form.sshPrivateKeyFile) {
                formData.append("SshPrivateKeyFile", form.sshPrivateKeyFile);
            }
            if (form.sshPrivateKeyPassphrase) {
                formData.append("SshPrivateKeyPassphrase", form.sshPrivateKeyPassphrase);
            }

            await axios.post(`${API_BASE_URL}/User/CreateUser`, formData, {
                headers: {
                    "X-API-KEY": tokens?.apiKey ?? "",
                    Authorization: `Bearer ${tokens?.jwtToken ?? ""}`,
                    Accept: "*/*",
                    "Content-Type": "multipart/form-data"
                },
            });

            set({ loading: false });
        } catch (err: any) {
            set({ error: err.response?.data?.error ?? err.message, loading: false });
        }
    },

    updateUser: async (form: UserForm) => {
        set({ loading: true, error: null });
        try {
            const tokens = getAuthTokens();
            const formData = new FormData();
            formData.append("Username", form.username);
            if (form.sshPrivateKeyFile) {
                formData.append("SshPrivateKeyFile", form.sshPrivateKeyFile);
            }
            if (form.sshPrivateKeyPassphrase) {
                formData.append("SshPrivateKeyPassphrase", form.sshPrivateKeyPassphrase);
            }
            if (form.isRoot !== undefined) formData.append("IsRoot", String(form.isRoot));
            if (form.canUseDocker !== undefined) formData.append("CanUseDocker", String(form.canUseDocker));
            if(form.CanUseOSManager !== undefined) formData.append("CanUseOSManager", String(form.CanUseOSManager));
            if (form.allowedDirectories) {
                form.allowedDirectories.forEach(dir => formData.append("AllowedDirectories", dir));
            }
            if (form.email) formData.append("Email", form.email);

            await axios.post(`${API_BASE_URL}/User/UpdateUserPermissions`, formData, {
                headers: {
                    "X-API-KEY": tokens?.apiKey ?? "",
                    Authorization: `Bearer ${tokens?.jwtToken ?? ""}`,
                    Accept: "*/*",
                    "Content-Type": "multipart/form-data"
                },
            });

            set({ loading: false });
        } catch (err: any) {
            set({ error: err.response?.data?.error ?? err.message, loading: false });
        }
    },
    deleteUser: async (
        username: string,
        sshPrivateKeyFile: File,
        sshPrivateKeyPassphrase?: string,
        removeFromDockerGroup: boolean = true,
        removeFromSudoGroup: boolean = true,
        sshUsername?: string
    ) => {
        set({ loading: true, error: null });

        try {
            const tokens = getAuthTokens();

            const formData = new FormData();
            formData.append("Username", username);
            formData.append("SshUsername", sshUsername?? "");
            formData.append("SshPrivateKeyFile", sshPrivateKeyFile);
            formData.append("RemoveFromDockerGroup", String(removeFromDockerGroup));
            formData.append("RemoveFromSudoGroup", String(removeFromSudoGroup));

            if (sshPrivateKeyPassphrase) {
                formData.append("SshPrivateKeyPassphrase", sshPrivateKeyPassphrase);
            }

            await axios.post(`${API_BASE_URL}/User/DeleteUser`, formData, {
                headers: {
                    "X-API-KEY": tokens?.apiKey ?? "",
                    Authorization: `Bearer ${tokens?.jwtToken ?? ""}`,
                    Accept: "*/*",
                    "Content-Type": "multipart/form-data"
                },
            });

            set({ loading: false });

        } catch (err: any) {
            set({ error: err.response?.data?.error ?? err.message, loading: false });
        }
    },
}));