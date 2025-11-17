import { deleteFolderConnection } from '../../Hubs/connection';

export const copyComponent = async (
    sourcePath: string,
    destinationPath: string,
    onSuccess?: (folderInfo: { Name: string; Path: string }) => void,
    onError?: (error: string) => void,
    overwrite: boolean = false,
    includeRoot: boolean = true
): Promise<void> => {
    if (!sourcePath || sourcePath.trim() === '') {
        throw new Error("Folder path cannot be empty");
    }
    if (!destinationPath || destinationPath.trim() === '') {
        throw new Error("Destination path cannot be empty");
    }

    const connection = deleteFolderConnection();

    try {
        if (onSuccess) {
            connection.on("CopyFolder", onSuccess);
        }
        if (onError) {
            connection.on("Error", onError);
        }
        await connection.start();
        await connection.invoke("CopyFolder", sourcePath, destinationPath.trim(), overwrite, includeRoot);
    } catch (error) {
        throw error;
    } finally {
        if (onSuccess) {
            connection.off("CopyFolder", onSuccess);
        }
        if (onError) {
            connection.off("Error", onError);
        }
        await connection.stop();
    }
};