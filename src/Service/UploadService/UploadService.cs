using System.IO.Compression;
using OSManager.Models;

namespace OSManager.Service.UploadService;

public class UploadService: IUploadService
{
    private readonly ILogger<UploadService> _logger;
    private readonly string _rootPath;

    public UploadService(ILogger<UploadService> logger)
    {
        _rootPath = Environment.GetEnvironmentVariable("MOUNT_ROOT") ?? "/hostroot";
        _logger = logger;
    }
  //   private string NormalizePathToRoot(string inputPath)
  //   {
  //       if (string.IsNullOrWhiteSpace(inputPath))
  //           throw new ArgumentException("Path không được để trống", nameof(inputPath));
  //
  //       string candidate = inputPath;
  //       if (!Path.IsPathRooted(candidate))
  //       {
  //           candidate = Path.Combine(_rootPath,
  //               candidate.TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar));
  //       }
  //       var full = Path.GetFullPath(candidate);
  //       var rootFull = Path.GetFullPath(_rootPath).TrimEnd(Path.DirectorySeparatorChar);
  //
  //       if (!full.StartsWith(rootFull + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) &&
  //           !string.Equals(full, rootFull, StringComparison.OrdinalIgnoreCase))
  //       {
  //           throw new UnauthorizedAccessException("Đường dẫn không hợp lệ hoặc nằm ngoài thư mục gốc.");
  //       }
  //       return full;
  //   }
  // public async Task UploadMixedAsync(string relativePath, List<FileUploadModel> items)
  //                         {
  //                             if (items == null || items.Count == 0)
  //                                 throw new ArgumentException("Không có dữ liệu nào được chọn để tải lên.");
  //                     
  //                             var targetDirectory = NormalizePathToRoot(relativePath);
  //                             Directory.CreateDirectory(targetDirectory);
  //                     
  //                             foreach (var item in items)
  //                             {
  //                                 try
  //                                 {
  //                                     if (item.IsDirectory)
  //                                     {
  //                                         var folderPath = Path.Combine(targetDirectory, item.FileName);
  //                                         Directory.CreateDirectory(folderPath);
  //                                         _logger.LogInformation("Created directory: {Path}", folderPath);
  //                                     }
  //                                     else
  //                                     {
  //                                         if (string.IsNullOrEmpty(item.Base64Data))
  //                                             throw new ArgumentException($"File {item.FileName} không có dữ liệu Base64.");
  //                     
  //                                         var extension = Path.GetExtension(item.FileName).ToLower();
  //                     
  //                                         if (extension == ".zip")
  //                       await HandleZipUploadAsync(item, targetDirectory);
  //                   else
  //                       await HandleFileUploadAsync(item, targetDirectory);
  //               }
  //           }
  //           catch (Exception ex)
  //           {
  //               _logger.LogError(ex, "Lỗi khi xử lý {FileName}", item.FileName);
  //               throw;
  //           }
  //       }
  //   }
  //   private async Task HandleFileUploadAsync(FileUploadModel fileModel, string targetDir)
  //   {
  //       var filePath = Path.Combine(targetDir, fileModel.FileName);
  //       await using var stream = new FileStream(filePath, FileMode.Create);
  //       var bytes = ConvertBase64ToBytes(fileModel.Base64Data!);
  //       await stream.WriteAsync(bytes);
  //       _logger.LogInformation("Uploaded file: {Path}", filePath);
  //   }
  //
  //   private async Task HandleZipUploadAsync(FileUploadModel zipModel, string targetDir)
  //   {
  //       var tempZipPath = await SaveBase64ToTempAsync(zipModel, targetDir);
  //       var extractPath = Path.Combine(targetDir, Path.GetFileNameWithoutExtension(zipModel.FileName));
  //       await ExtractZipAsync(tempZipPath, extractPath);
  //       File.Delete(tempZipPath);
  //       _logger.LogInformation("Extracted ZIP: {ZipFile} → {ExtractPath}", zipModel.FileName, extractPath);
  //   }
  //
  //   private byte[] ConvertBase64ToBytes(string base64Data)
  //   {
  //       return Convert.FromBase64String(base64Data);
  //   }
  //
  //   private async Task<string> SaveBase64ToTempAsync(FileUploadModel fileModel, string targetDir)
  //   {
  //       var tempPath = Path.Combine(targetDir, $"{Guid.NewGuid()}.tmp");
  //       var bytes = ConvertBase64ToBytes(fileModel.Base64Data!);
  //       await File.WriteAllBytesAsync(tempPath, bytes);
  //       return tempPath;
  //   }
  //
  //   private async Task ExtractZipAsync(string zipPath, string extractTo)
  //   {
  //       await Task.Run(() =>
  //       {
  //           if (Directory.Exists(extractTo))
  //               Directory.Delete(extractTo, true);
  //           Directory.CreateDirectory(extractTo);
  //           ZipFile.ExtractToDirectory(zipPath, extractTo);
  //       });
  //   }
  //   
  //   private async Task UploadFileDirectAsync(string targetDir, string fileName, Stream fileStream)
  //   {
  //       var filePath = Path.Combine(targetDir, fileName);
  //       Directory.CreateDirectory(targetDir);
  //
  //       await using var fs = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None, bufferSize: 81920, useAsync: true);
  //       await fileStream.CopyToAsync(fs);
  //
  //       _logger.LogInformation("Uploaded file directly: {Path}", filePath);
  //   }
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
                    _logger.LogInformation("Created folder: {Path}", folderPath);
                }
                else
                {
                    if (item.FileStream == null)
                        throw new ArgumentException($"File {item.FileName} không có dữ liệu Stream.");

                    await SaveStreamToFileAsync(targetDir, item.FileName, item.FileStream);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xử lý {FileName}", item.FileName);
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