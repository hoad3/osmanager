// Ví dụ sử dụng hàm socket để xóa folder

import { deleteFolder } from './DeleteComponent.tsx';

interface FolderInfo {
  Name: string;
  Path: string;
}export const deleteFolderSocket = async (folderPath: string) => {
  try {
    await deleteFolder(
      folderPath,
      true, 
      (folderInfo: FolderInfo) => {
        console.log('Folder deleted successfully:', folderInfo);
      },
      (error: string) => {
        console.error('Delete error:', error);
      }
    );
  } catch (error) {
    console.error('Failed to delete folder:', error);
  }
};
export const useDeleteFolderComponent = () => {
  const handleDeleteFolder = async (folderPath: string) => {
    try {
      await deleteFolder(
        folderPath,
        true,
        (folderInfo: FolderInfo) => {
          console.log('Folder deleted:', folderInfo);
        },
        (error: string) => {
          console.error('Error:', error);
        }
      );
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  return { handleDeleteFolder };
};
