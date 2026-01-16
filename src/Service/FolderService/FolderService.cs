using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using OSManager.Models;
using OSManager.Service.Auth;
using OSManager.Service.HistoryOS;
using OSManager.Service.TimeService;

namespace OSManager.Service.FolderService;

public class FolderService : IFolderService
{
    private readonly string _rootPath;
    ILogger<FolderService> _logger;
    private readonly IHistoryQueue _queue;
    private readonly ICurrentUserService _currentUser;
    private readonly ITimeService _timeService;
    public FolderService(ILogger<FolderService> logger, IHistoryQueue queue, ICurrentUserService currentUser, ITimeService timeService)
    {
        _timeService = timeService;
        _rootPath = Environment.GetEnvironmentVariable("MOUNT_ROOT") ?? "/hostroot";
        _logger = logger;
        _queue = queue;
        _currentUser = currentUser;

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
            _queue.Enqueue(new LogEntry
            {
                Action = "Tạo File/Folder",
                Target = fullPath,
                Details = $"Tạo File/Folder thành công: {fullPath}",
                Timestamp = _timeService.GetVietnamNowOffset()
            });
            _logger.LogInformation("Created directory at {Path}", fullPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create directory at {Path}", relativePath);
            _queue.Enqueue(new LogEntry
            {
                Action = "Tạo File/Folder",
                Target = relativePath,
                Details = $"Tạo File/Folder thất bại: {relativePath}",
                Timestamp = _timeService.GetVietnamNowOffset()
            });
            throw;
        }

        return Task.CompletedTask;
    }
    public Task DeleteAsync(string relativePath, bool recursive = true)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            throw new ArgumentException("Đường dẫn không được để trống", nameof(relativePath));
        var full = NormalizePathToRoot(relativePath);
        return Task.Run(() =>
        {
            try
            {
                if (File.Exists(full))
                {
                    File.Delete(full);
                    _queue.Enqueue(new LogEntry
                    {
                        Action = "Xóa File",
                        Target = full,
                        Details = $"Xóa File thành công: {full}",
                        Timestamp = _timeService.GetVietnamNowOffset()
                    });
                    _logger.LogInformation("Deleted file at {Path}", full);
                }
                else if (Directory.Exists(full))
                {
                    if (recursive)
                    {
                        Directory.Delete(full, true);
                        _queue.Enqueue(new LogEntry
                        {
                            Action = "Xóa Folder",
                            Target = full,
                            Details = $"Xóa Folder thành công: {full}",
                            Timestamp = _timeService.GetVietnamNowOffset()
                        });
                    }
                    else
                    {
                        var entries = Directory.EnumerateFileSystemEntries(full);
                        if (entries.Any())
                            throw new IOException("Directory not empty.");
                        Directory.Delete(full, false);
                    }

                    _logger.LogInformation("Deleted directory at {Path}", full);
                }
                else
                {
                    throw new FileNotFoundException($"Không tìm thấy file hoặc folder: {full}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete path: {Path}", full);
                throw;
            }
        });
    }
    public Task RenameAsync(string path, string newName)
    {
        var full = NormalizePathToRoot(path);

        var parent = Path.GetDirectoryName(full) 
                     ?? throw new InvalidOperationException("Invalid path");

        var dest = Path.Combine(parent, newName);
        dest = Path.GetFullPath(dest);

        return Task.Run(() =>
        {
            if (Directory.Exists(full))
            {
                if (Directory.Exists(dest))
                    throw new IOException($"Destination folder already exists: {dest}");

                Directory.Move(full, dest);
            }
            else if (File.Exists(full))
            {
                if (File.Exists(dest))
                    throw new IOException($"Destination file already exists: {dest}");

                File.Move(full, dest);
            }
            else
            {
                throw new FileNotFoundException($"File or folder not found: {full}");
            }

            _queue.Enqueue(new LogEntry
            {
                Action = "Đổi tên File/Folder",
                Target = full,
                Details = $"Đổi tên thành: {dest}",
                Timestamp = _timeService.GetVietnamNowOffset()
            });
        });
    }
    public Task CopyAsync([FromQuery] string sourcePath, [FromQuery] string destinationPath, [FromQuery] bool overwrite = false, [FromQuery] bool includeRoot = true)
    {
        var src = NormalizePathToRoot(sourcePath);
        var dstRoot = NormalizePathToRoot(destinationPath);
        bool isFile = File.Exists(src);
        bool isDirectory = Directory.Exists(src);
        if (!isFile && !isDirectory)
            throw new FileNotFoundException($"Source not found: {src}");
        return Task.Run(() =>
        {
            if (isFile)
            {
                if (!Directory.Exists(dstRoot))
                    throw new DirectoryNotFoundException($"Destination folder not found: {dstRoot}");
                var targetFile = Path.Combine(dstRoot, Path.GetFileName(src));

                if (File.Exists(targetFile))
                {
                    if (overwrite)
                        File.Delete(targetFile);
                    else
                        throw new IOException($"Destination file already exists: {targetFile}");
                }
                File.Copy(src, targetFile, overwrite);
                _queue.Enqueue(new LogEntry
                {
                    Action = "Copy File",
                    Target = $"{src} ==> {targetFile}",
                    Details = "Copy file thành công",
                    Timestamp = _timeService.GetVietnamNowOffset()
                });
                return;
            }
            var sourceFolderName = new DirectoryInfo(src).Name;
            var dstFinal = includeRoot
                ? Path.Combine(dstRoot, sourceFolderName)
                : dstRoot;
            Directory.CreateDirectory(dstFinal);
            CopyDirectoryContents(src, dstFinal, overwrite);
            _queue.Enqueue(new LogEntry
            {
                Action = "Copy Folder",
                Target = $"{src} ==> {dstFinal}",
                Details = "Copy folder thành công",
                Timestamp = _timeService.GetVietnamNowOffset()
            });
        });
    }
    public Task MoveAsync(string sourcePath, string destinationPath, bool overwrite = false)
    {
        var src = NormalizePathToRoot(sourcePath);
        var dstRoot = NormalizePathToRoot(destinationPath);

        bool isFile = File.Exists(src);
        bool isDirectory = Directory.Exists(src);

        if (!isFile && !isDirectory)
            throw new FileNotFoundException($"Source not found: {src}");

        return Task.Run(() =>
        {
            if (isFile)
            {
                if (Directory.Exists(dstRoot))
                    dstRoot = Path.Combine(dstRoot, Path.GetFileName(src));

                if (File.Exists(dstRoot))
                {
                    if (overwrite)
                        File.Delete(dstRoot);
                    else
                        throw new IOException($"Destination file already exists: {dstRoot}");
                }

                File.Move(src, dstRoot, overwrite);
            }
            else if (isDirectory)
            {
                var dst = Path.Combine(dstRoot, new DirectoryInfo(src).Name);

                if (Directory.Exists(dst))
                {
                    if (overwrite)
                        Directory.Delete(dst, true);
                    else
                        throw new IOException($"Destination directory already exists: {dst}");
                }

                try
                {
                    Directory.Move(src, dst);
                }
                catch (IOException)
                {
                    CopyDirectoryRecursive(src, dst);
                    Directory.Delete(src, true);
                }
            }
        });
    }
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
    private static void CopyDirectoryContents(string sourceDir, string destinationDir, bool overwrite)
    {
        var dir = new DirectoryInfo(sourceDir);
        if (!dir.Exists) throw new DirectoryNotFoundException(sourceDir);

        // Copy tất cả file trong thư mục nguồn
        foreach (var file in dir.GetFiles())
        {
            var destFile = Path.Combine(destinationDir, file.Name);
            
            if (File.Exists(destFile))
            {
                if (overwrite)
                {
                    File.Delete(destFile);
                    file.CopyTo(destFile);
                }
                else
                {
                    throw new IOException($"File already exists: {destFile}");
                }
            }
            else
            {
                file.CopyTo(destFile);
            }
        }
        foreach (var subDir in dir.GetDirectories())
        {
            var destSub = Path.Combine(destinationDir, subDir.Name);
            
            if (Directory.Exists(destSub))
            {
                if (overwrite)
                {
                    Directory.Delete(destSub, true);
                    CopyDirectoryRecursive(subDir.FullName, destSub);
                }
                else
                {
                    throw new IOException($"Directory already exists: {destSub}");
                }
            }
            else
            {
                CopyDirectoryRecursive(subDir.FullName, destSub);
            }
        }
    }
}