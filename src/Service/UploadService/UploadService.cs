using System.IO.Compression;
using OSManager.Models;
using OSManager.Service.Auth;
using OSManager.Service.HistoryOS;
using OSManager.Service.TimeService;

namespace OSManager.Service.UploadService;

public class UploadService: IUploadService
{
    private readonly ILogger<UploadService> _logger;
    private readonly string _rootPath;
    private readonly IHistoryQueue _queue;
    private readonly ICurrentUserService _currentUser;
    private readonly ITimeService _timeService;
    public UploadService(ILogger<UploadService> logger, IHistoryQueue queue, ICurrentUserService currentUser, ITimeService timeService)
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
            candidate = Path.Combine(_rootPath,
                candidate.TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar));
        }

        var full = Path.GetFullPath(candidate);
        var rootFull = Path.GetFullPath(_rootPath).TrimEnd(Path.DirectorySeparatorChar);

        if (!full.StartsWith(rootFull + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(full, rootFull, StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Đường dẫn không hợp lệ hoặc nằm ngoài thư mục gốc.");
        }

        return full;
    }
    public async Task UploadItemsAsync(string relativePath, List<FileUploadModel> items)
    {
        if (items == null || items.Count == 0)
            throw new ArgumentException("Không có dữ liệu nào để upload.");

        var targetDir = NormalizePathToRoot(relativePath);
        Directory.CreateDirectory(targetDir);

        foreach (var item in items)
        {
            try
            {
                if (item.IsDirectory)
                {
                    var folderPath = Path.Combine(targetDir, item.FileName);
                    Directory.CreateDirectory(folderPath);
                    _queue.Enqueue(new LogEntry
                    {
                        Action = "Upload Folder",
                        Target = folderPath,
                        Details = $"Upload Folder thành công: {folderPath}",
                        Timestamp = _timeService.GetVietnamNowOffset()
                    });
                    _logger.LogInformation("Created folder: {Path}", folderPath);
                }
                else
                {
                    if (item.FileStream == null)
                        throw new ArgumentException($"File {item.FileName} không có dữ liệu Stream.");

                    await SaveStreamToFileAsync(targetDir, item.FileName, item.FileStream);
                    _queue.Enqueue(new LogEntry
                    {
                        Action = "Upload File",
                        Target = targetDir,
                        Details = $"Upload File thành công: {targetDir}",
                        Timestamp = _timeService.GetVietnamNowOffset()
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xử lý {FileName}", item.FileName);
                _queue.Enqueue(new LogEntry
                {
                    Action = "Upload File",
                    Target = targetDir,
                    Details = $"Upload File thất bại: {targetDir}",
                    Timestamp = _timeService.GetVietnamNowOffset()
                });
                throw;
            }
        }
    }

    private async Task SaveStreamToFileAsync(string targetDir, string fileName, Stream fileStream)
    {
        var filePath = Path.Combine(targetDir, fileName);
        var directory = Path.GetDirectoryName(filePath);
        if (!string.IsNullOrEmpty(directory))
            Directory.CreateDirectory(directory);

        await using var fs = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, useAsync: true);
        await fileStream.CopyToAsync(fs);

        _logger.LogInformation("Uploaded file: {Path}", filePath);
    }

    
}