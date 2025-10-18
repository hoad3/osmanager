using OSManager.API.Models;

namespace OSManager.Service.DirectoryExplorerService;

public class DirectoryExplorerService:IDirectoryExplorerService
{
    private readonly string _rootPath;

    public DirectoryExplorerService()
    {
        _rootPath = Environment.GetEnvironmentVariable("MOUNT_ROOT") ?? "/hostroot";
    }

    public List<DirectoryEntry> Browse(string? relativePath)
    {
        var absolutePath = GetAbsolutePath(relativePath);
        EnsureWithinRoot(absolutePath);
        return GetDirectoryContents(absolutePath);
    }

    private string GetAbsolutePath(string? relativePath)
    {
        return relativePath == null
            ? _rootPath
            : Path.Combine(_rootPath, relativePath.TrimStart('/'));
    }

    private void EnsureWithinRoot(string fullPath)
    {
        var normalized = Path.GetFullPath(fullPath);
        if (!normalized.StartsWith(_rootPath))
            throw new UnauthorizedAccessException("Access outside root is not allowed.");
    }

    private List<DirectoryEntry> GetDirectoryContents(string fullPath)
    {
        if (!Directory.Exists(fullPath))
            throw new DirectoryNotFoundException($"Directory not found: {fullPath}");

        var entries = Directory.GetFileSystemEntries(fullPath);
        return entries.Select(BuildEntry).ToList();
    }

    private DirectoryEntry BuildEntry(string path)
    {
        return new DirectoryEntry
        {
            Name = Path.GetFileName(path),
            FullPath = Path.GetRelativePath(_rootPath, path),
            IsDirectory = Directory.Exists(path),
            SizeInBytes = File.Exists(path) ? new FileInfo(path).Length : null
        };
    }
}