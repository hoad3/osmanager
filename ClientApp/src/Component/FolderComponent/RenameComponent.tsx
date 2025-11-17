import { deleteFolderConnection } from '../../Hubs/connection';

export const renameComponent = async (
    relativePath: string,
    newName: string,
    onSuccess?: (folderInfo: { Name: string; Path: string }) => void,
    onError?: (error: string) => void
): Promise<void> => {
    if (!relativePath || relativePath.trim() === '') {
        throw new Error("Folder path cannot be empty");
    }
    if (!newName || newName.trim() === '') {
        throw new Error("New name cannot be empty");
    }

    const connection = deleteFolderConnection(); // Sử dụng cùng connection với delete
    
    try {
        if (onSuccess) {
            connection.on("RenameFolder", onSuccess);
        }
        if (onError) {
            connection.on("Error", onError);
        }
        await connection.start();
        await connection.invoke("RenameFolder", relativePath, newName.trim());
    } catch (error) {
        throw error;
    } finally {
        if (onSuccess) {
            connection.off("RenameFolder", onSuccess);
        }
        if (onError) {
            connection.off("Error", onError);
        }
        await connection.stop();
    }
};