using Microsoft.Extensions.Options;
using OSManager.API.Models;
using OSManager.Core.Core.Helpers;

namespace OSManager.Service.DirectoryService;

public class DirectoryScannerService:IDirectoryScannerService
{
    private readonly string _hostRoot;
    private readonly ILogger<DirectoryScannerService> _logger;

    public DirectoryScannerService(ILogger<DirectoryScannerService> logger, Core_Helpers_EnvironmentHelper envHelper)
    {
        _hostRoot = envHelper.GetHostRoot(); 
        _logger = logger;
    }

    public List<DirectoryEntry> ScanDirectory(string subPath = "/")
    {
        var fullPath = Path.Combine(_hostRoot, subPath.TrimStart('/'));
        var result = new List<DirectoryEntry>();

        try
        {
            if (!Directory.Exists(fullPath))
                return result;

            foreach (var dir in Directory.GetDirectories(fullPath))
            {
                result.Add(new DirectoryEntry
                {
                    Name = Path.GetFileName(dir),
                    FullPath = Path.GetRelativePath(_hostRoot, dir),
                    IsDirectory = true
                });
            }

            foreach (var file in Directory.GetFiles(fullPath))
            {
                var fileInfo = new FileInfo(file);
                result.Add(new DirectoryEntry
                {
                    Name = Path.GetFileName(file),
                    FullPath = Path.GetRelativePath(_hostRoot, file),
                    IsDirectory = false,
                    SizeInBytes = fileInfo.Length
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to scan directory: {fullPath}");
        }

        return result;
    }
}