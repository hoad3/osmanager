import {UploadConnection} from "../connection.ts";
import type {FileUploadModel} from "../../Interface/Model.tsx";


export const initUploadHub = async () => {
    const connection = UploadConnection();
    try {
        if (connection.state !== "Connected") {
            await connection.start();
        }
        return connection;
    } catch (err) {
        console.error("Upload hub connection error:", err);
        throw err;
    }
};

export const uploadFiles = async (
    connection: any,
    relativePath: string,
    files: File[],
    onSuccess?: (result: any) => void,
    onError?: (error: any) => void
): Promise<void> => {
    if (!connection) throw new Error("Connection chưa được cung cấp.");
    if (typeof connection.start === "function" && connection.state !== "Connected") {
        await connection.start();
    }
    const readFileAsBase64 = (file: File): Promise<FileUploadModel> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                if (typeof result !== "string") {
                    return reject(new Error(`File ${file.name} không thể chuyển sang data URL.`));
                }
                const parts = result.split(",");
                const base64String = parts.length > 1 ? parts[1] : null;
                if (!base64String || base64String.trim() === "") {
                    return reject(new Error(`File ${file.name} không có dữ liệu Base64.`));
                }
                resolve({ fileName: file.name, Base64Data: base64String });
            };
            reader.onerror = () => reject(new Error(`Đọc file ${file.name} thất bại.`));
            reader.readAsDataURL(file);
        });
    };
    const fileModels: FileUploadModel[] = [];
    for (const f of files) {
        try {
            const m = await readFileAsBase64(f);
            fileModels.push(m);
        } catch (err) {
            if (onError) onError(err);
            else console.error(err);
            // nếu một file lỗi, dọn dẹp và thoát
            try { if (typeof connection.stop === "function") await connection.stop(); } catch {}
            throw err;
        }
    }
    const successHandler = (msg: any) => {
        if (onSuccess) onSuccess(msg);
    };
    const errorHandler = (err: any) => {
        if (onError) onError(err);
    };

    try {
        connection.on("Uploads", successHandler);
        connection.on("UploadeError", errorHandler);
        for (const model of fileModels) {
            await connection.invoke("Uploads", relativePath, [model]);
        }
    } catch (err) {
        if (onError) onError(err);
        else console.error(err);
        throw err;
    } finally {
        try { connection.off("Uploads", successHandler); } catch {}
        try { connection.off("UploadeError", errorHandler); } catch {}
        try { if (typeof connection.stop === "function") await connection.stop(); } catch {}
    }
};