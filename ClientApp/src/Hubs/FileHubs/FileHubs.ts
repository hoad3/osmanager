import {fileConnection} from "../connection.ts";

export const FileCreateHubs = async (
    relativePath: string,
    onSuccess?: (fileInfo: { Name: string; Path: string }) => void,
    onError?: (error: string) => void
): Promise<void> => {
    if (!relativePath || relativePath.trim() === '') {
        throw new Error("Folder path cannot be empty");
    }
    const connection = fileConnection(); 

    try {
        if (onSuccess) {
            connection.on("CreateFiles", onSuccess);
        }
        if (onError) {
            connection.on("FileCreateError", onError);
        }
        await connection.start();
        await connection.invoke("CreateFiles", relativePath);
    } catch (error) {
        throw error;
    } finally {
        if (onSuccess) {
            connection.off("CreateFiles", onSuccess);
        }
        if (onError) {
            connection.off("FileCreateError", onError);
        }
        await connection.stop();
    }
};

export const FileUpdateHubs = async (
    relativePath: string,
    newContent: string,
    onSuccess?: (fileInfo: { Name: string; Path: string }) => void,
    onError?: (error: string) => void
): Promise<void> => {
    if (!relativePath || relativePath.trim() === '') {
        throw new Error("Folder path cannot be empty");
    }
    const connection = fileConnection();

    try {
        if (onSuccess) {
            connection.on("UpdateFiles", onSuccess);
        }
        if (onError) {
            connection.on("FileUpdateError", onError);
        }
        await connection.start();
        await connection.invoke("UpdateFiles", relativePath, newContent);
    } catch (error) {
        throw error;
    } finally {
        if (onSuccess) {
            connection.off("UpdateFiles", onSuccess);
        }
        if (onError) {
            connection.off("FileUpdateError", onError);
        }
        await connection.stop();
    }
};