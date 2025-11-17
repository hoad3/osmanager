import { deleteFolderConnection } from '../../Hubs/connection';
export const deleteFolder = async (
  relativePath: string,
  recursive: boolean = true,
  onSuccess?: (folderInfo: { Name: string; Path: string }) => void,
  onError?: (error: string) => void
): Promise<void> => {
  if (!relativePath || relativePath.trim() === '') {
    throw new Error("Folder path cannot be empty");
  }

  const connection = deleteFolderConnection();
  
  try {
    if (onSuccess) {
      connection.on("DeleteFolder", onSuccess);
    }
    if (onError) {
      connection.on("Error", onError);
    }
    await connection.start();
    await connection.invoke("deleteFolder", relativePath, recursive);
  } catch (error) {
    console.error("Error deleting folder:", error);
    throw error;
  } finally {
    if (onSuccess) {
      connection.off("DeleteFolder", onSuccess);
    }
    if (onError) {
      connection.off("Error", onError);
    }
    await connection.stop();
  }
};
