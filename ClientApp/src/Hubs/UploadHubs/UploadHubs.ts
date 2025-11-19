import {UploadConnection} from "../connection.ts";
import type {FileUploadModel} from "../../Interface/Model.tsx";
export const uploadFiles = async (
    relativePath: string,
    files: File[],
    onSuccess?: (result: any) => void,
    onError?: (error: any) => void
) => {
    const connection = UploadConnection();
    const successHandler = (msg: any) => onSuccess?.(msg);
    const errorHandler = (err: any) => onError?.(err);
    try {
        if (connection.state !== "Connected") {
            await connection.start();
        }
        const fileModels: FileUploadModel[] = files.map(f => ({
            fileName: f.name,
            fileStream: f,   
            isFolder: false
        }));
        connection.on("Uploads", successHandler);
        connection.on("UploadeError", errorHandler);
        for (const model of fileModels) {
            await connection.invoke("Uploads", relativePath, [model]);
        }
    } catch (err) {
        onError?.(err);
        console.error("Upload error:", err);
        throw err;
    } finally {
        try { connection.off("Uploads", successHandler); } catch {}
        try { connection.off("UploadeError", errorHandler); } catch {}
        try { await connection.stop(); } catch {}
    }
};