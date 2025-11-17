using Microsoft.AspNetCore.Mvc;

namespace OSManager.Service.FolderService;

public interface IFolderService
{
    Task CreateAsync(string path);
    Task DeleteAsync(string relativePath, bool recursive = true);
    Task RenameAsync(string path, string newName);
    Task CopyAsync([FromQuery] string sourcePath,[FromQuery] string destinationPath,[FromQuery] bool overwrite = false, [FromQuery] bool includeRoot = true);
    Task MoveAsync(string sourcePath, string destinationPath, bool overwrite = false);
}