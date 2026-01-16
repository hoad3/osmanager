import {create} from "zustand/react";
export type AuthToken = {
  apiKey: string;
  jwtToken: string;
  role: string;
};
import axios from 'axios';
// import {encryptAes256Cbc_Base64} from "../../../utils/HashAuthData.ts";
interface AuthState {
    token: AuthToken | null;
    user: string | null;
    loading: boolean;
    error: Error | null;
    login: (username: string, password: string) => Promise<boolean>;
    loginSSHKey: (username: string, SSHKey:File) => Promise<boolean>;
    logout: () => void;
    
}
// const SECRET = import.meta.env.VITE_OSMANAGER_SECRET_KEY as string;


export const saveAuthTokens = (apiKey: string, jwtToken: string,username: string, role: string, expiresInSeconds: number) => {
    const now = Date.now();
    const expires = now + expiresInSeconds * 1000;
    
    const tokenData = {
        apiKey,
        jwtToken,
        username,
        role,
        expires
    };
    localStorage.setItem('authTokens', JSON.stringify(tokenData));
}

export const getAuthTokens = (): {apiKey: string, jwtToken: string, role: string, username: string} | null =>{
    const tokenData = localStorage.getItem('authTokens');
    if(!tokenData) return null;
    const {apiKey, jwtToken,role, username, expires} = JSON.parse(tokenData);
    if(Date.now() > expires) {
        localStorage.removeItem('authTokens');
        return null;
    }
    return {apiKey, jwtToken, role, username};
}

const API_BASE_URL = '/api'

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    loading: false,
    error: null,
    
    

    login: async (username: string, password: string): Promise<boolean> => {
        try {
            // if (!SECRET) {
            //     console.warn('No encryption secret provided.');
            // }
            // console.log(
            //     CryptoJS.SHA256(SECRET).toString(CryptoJS.enc.Hex)
            // );
            // const secret = SECRET;
            // const encryptedPayload = JSON.stringify({ username, password });
            //
            // // Encrypt 1 lần duy nhất
            // const { iv, cipher } = encryptAes256Cbc_Base64(encryptedPayload, secret);
            //
            // console.log("ENC = ", encryptedPayload);
            // console.log("Decrypt = ", encryptAes256Cbc_Base64(encryptedPayload, secret));

            const response = await axios.post(
                `${API_BASE_URL}/Auth/login/password`,
                { username, password },
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            const { apiKey, jwtToken, role } = response.data.response;
            set({ token: { apiKey, jwtToken, role } });
            saveAuthTokens(apiKey, jwtToken, username, role, 1800);

            return true;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    },

    loginSSHKey: async (username: string, sshPrivateKeyFile: File): Promise<boolean> => {
        try {
            const formData = new FormData();
            formData.append("Username", username);
            formData.append("SshPrivateKeyFile", sshPrivateKeyFile);
            const response = await axios.post(
                `${API_BASE_URL}/Auth/login/sshkey`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const { apiKey, jwtToken, role } = response.data.response;
            // console.log("data sshkey: ", response.data.response)
            set({ token: { apiKey, jwtToken, role } });
            saveAuthTokens(apiKey, jwtToken, username, role, 1800);

            return true;
        } catch (error) {
            console.error("SSH key login failed:", error);
            return false;
        }
    },
    logout: () => {
        set({ token: null });
        localStorage.removeItem('authTokens');
    },
}));