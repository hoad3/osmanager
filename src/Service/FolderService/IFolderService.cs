namespace OSManager.Service.FolderService;

public interface IFolderService
{
    Task CreateAsync(string path);
    Task DeleteAsync(string relativePath, bool recursive = true);
    Task RenameAsync(string path, string newName);
    Task CopyAsync(string sourcePath, string destinationPath, bool overwrite = false);
    Task MoveAsync(string sourcePath, string destinationPath, bool overwrite = false);
}