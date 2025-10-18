using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace OSManager.Service.FolderService;

public class FolderService : IFolderService
{
    private readonly string _rootPath;
    ILogger<FolderService> _logger;
    public FolderService(ILogger<FolderService> logger)
    {
        _rootPath = Environment.GetEnvironmentVariable("MOUNT_ROOT") ?? "/hostroot";
        _logger = logger;
    }
    private string NormalizePathToRoot(string inputPath)
    {
        if (string.IsNullOrWhiteSpace(inputPath))
            throw new ArgumentException("Path không được để trống", nameof(inputPath));
        string candidate = inputPath;
        if (!Path.IsPathRooted(candidate))
        {
            candidate = Path.Combine(_rootPath, candidate.TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar));
        }

        var full = Path.GetFullPath(candidate);

        var rootFull = Path.GetFullPath(_rootPath).TrimEnd(Path.DirectorySeparatorChar);
        if (!full.StartsWith(rootFull + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(full, rootFull, StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Invalid path.");
        }

        return full;
    }
    
    public Task CreateAsync(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            throw new ArgumentException("Path không được để trống", nameof(relativePath));

        try
        {
            var safePath = relativePath.TrimStart('/');
            var fullPath = Path.Combine(_rootPath, safePath);
            Directory.CreateDirectory(fullPath);
            _logger.LogInformation("Created directory at {Path}", fullPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create directory at {Path}", relativePath);
            throw;
        }

        return Task.CompletedTask;
    }
    public Task DeleteAsync(string relativePath, bool recursive = true)
    {
        var full = NormalizePathToRoot(relativePath);

        if (!Directory.Exists(full))
            throw new DirectoryNotFoundException($"Folder not found: {full}");

        return Task.Run(() =>
        {
            if (recursive)
                Directory.Delete(full, true);
            else
            {
                var entries = Directory.EnumerateFileSystemEntries(full);
                if (entries.Any())
                    throw new IOException("Directory not empty.");
                Directory.Delete(full, false);
            }
        });
    }
    public Task RenameAsync(string path, string newName)
    {
        var full = NormalizePathToRoot(path);
        if (!Directory.Exists(full))
            throw new DirectoryNotFoundException($"Folder not found: {full}");

        var parent = Path.GetDirectoryName(full) ?? throw new InvalidOperationException("Invalid folder path");
        var dest = Path.Combine(parent, newName);
        dest = Path.GetFullPath(dest);

        return Task.Run(() =>
        {
            if (Directory.Exists(dest))
                throw new IOException($"Destination already exists: {dest}");
            Directory.Move(full, dest);
        });
    }
    public Task CopyAsync(string sourcePath, string destinationPath, bool overwrite = false)
    {
        var src = NormalizePathToRoot(sourcePath);
        var dst = NormalizePathToRoot(destinationPath);

        if (!Directory.Exists(src))
            throw new DirectoryNotFoundException($"Source folder not found: {src}");

        return Task.Run(() =>
        {
            if (Directory.Exists(dst))
            {
                if (overwrite)
                    Directory.Delete(dst, true);
                else
                    throw new IOException($"Destination already exists: {dst}");
            }

            CopyDirectoryRecursive(src, dst);
        });
    }
    public Task MoveAsync(string sourcePath, string destinationPath, bool overwrite = false)
    {
        var src = NormalizePathToRoot(sourcePath);
        var dst = NormalizePathToRoot(destinationPath);

        if (!Directory.Exists(src))
            throw new DirectoryNotFoundException($"Source folder not found: {src}");

        return Task.Run(() =>
        {
            if (Directory.Exists(dst))
            {
                if (overwrite)
                    Directory.Delete(dst, true);
                else
                    throw new IOException($"Destination already exists: {dst}");
            }

            try
            {
                Directory.Move(src, dst);
            }
            catch (IOException)
            {
                // fallback: copy then delete source
                CopyDirectoryRecursive(src, dst);
                Directory.Delete(src, true);
            }
        });
    }

    // helper: sao chép đệ quy
    private static void CopyDirectoryRecursive(string sourceDir, string destinationDir)
    {
        var dir = new DirectoryInfo(sourceDir);
        if (!dir.Exists) throw new DirectoryNotFoundException(sourceDir);

        Directory.CreateDirectory(destinationDir);

        foreach (var file in dir.GetFiles())
        {
            var destFile = Path.Combine(destinationDir, file.Name);
            file.CopyTo(destFile, true);
        }

        foreach (var subDir in dir.GetDirectories())
        {
            var destSub = Path.Combine(destinationDir, subDir.Name);
            CopyDirectoryRecursive(subDir.FullName, destSub);
        }
    }
}