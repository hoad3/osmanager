using OSManager.API.Models;

namespace OSManager.Service.DirectoryExplorerService;

public interface IDirectoryExplorerService
{
    List<DirectoryEntry> Browse(string? relativePath);
}