using OSManager.API.Models;

namespace OSManager.Service.DirectoryService;

public interface IDirectoryScannerService
{
    List<DirectoryEntry> ScanDirectory(string subPath = "/");
}