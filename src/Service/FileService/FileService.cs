using System.Text;

namespace OSManager.Service.FileService;

public class FileService : IFileService
{
    private readonly string _rootPath;
    ILogger<FileService> _logger;

    public FileService(ILogger<FileService> logger)
    {
        _logger = logger;
        _rootPath = Environment.GetEnvironmentVariable("MOUNT_ROOT") ?? "/hostroot";

    }

    public Task<string> CreateFileAsync(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            throw new ArgumentException("Đường dẫn không được để trống", nameof(relativePath));

        try
        {
            var safePath = relativePath.TrimStart('/');
            var candidateFull = Path.Combine(_rootPath, safePath);
            string createdFullPath;
            if (relativePath.EndsWith("/") || relativePath.EndsWith("\\") || Directory.Exists(candidateFull))
            {
                var dir = candidateFull;
                if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                createdFullPath = Path.Combine(dir, "newfile.txt");
            }
            else
            {
                var lastSegment = Path.GetFileName(candidateFull);
                var parent = Path.GetDirectoryName(candidateFull) ?? _rootPath;

                if (Path.HasExtension(lastSegment))
                {
                    if (!Directory.Exists(parent)) Directory.CreateDirectory(parent);
                    createdFullPath = candidateFull;
                }
                else
                {
                    if (Directory.Exists(parent))
                    {
                        createdFullPath = candidateFull;
                        if (!Directory.Exists(parent)) Directory.CreateDirectory(parent);
                    }
                    else
                    {
                        Directory.CreateDirectory(candidateFull);
                        createdFullPath = Path.Combine(candidateFull, "newfile.txt");
                    }
                }
            }

            var createdDir = Path.GetDirectoryName(createdFullPath);
            if (!Directory.Exists(createdDir)) Directory.CreateDirectory(createdDir);
            if (!File.Exists(createdFullPath))
            {
                using (File.Create(createdFullPath))
                {
                }

                _logger.LogInformation("Created file at {Path}", createdFullPath);
            }
            else
            {
                _logger.LogWarning("File already exists at {Path}", createdFullPath);
            }

            // return relative path from root
            var relative = Path.GetRelativePath(_rootPath, createdFullPath).Replace(Path.DirectorySeparatorChar, '/');
            return Task.FromResult(relative);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create file at {Path}", relativePath);
            throw;
        }
    }

    public async Task UpdateFileContentAsync(string relativePath, string newContent)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            throw new ArgumentException("Đường dẫn không được để trống", nameof(relativePath));

        try
        {
            var safePath = relativePath.TrimStart('/');
            var fullPath = Path.Combine(_rootPath, safePath);

            if (!File.Exists(fullPath))
                throw new FileNotFoundException($"Không tìm thấy file: {relativePath}");

            await File.WriteAllTextAsync(fullPath, newContent);
            _logger.LogInformation("Updated content of file at {Path}", fullPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update file content at {Path}", relativePath);
            throw;
        }
    }

    public async Task<string> ReadFileContentAsync(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        throw new ArgumentException("Path cannot be empty", nameof(relativePath));

    var cts = new CancellationTokenSource(TimeSpan.FromSeconds(20)); // Timeout 20s

    try
    {
        var safePath = relativePath.TrimStart('/');
        var fullPath = Path.Combine(_rootPath, safePath);
        fullPath = Path.GetFullPath(fullPath);

        if (!fullPath.StartsWith(_rootPath))
            throw new UnauthorizedAccessException("Invalid path outside root");

        if (!File.Exists(fullPath))
            throw new FileNotFoundException($"File not found: {safePath}");

        var sb = new StringBuilder();
        const int bufferSize = 64 * 1024; // 
        byte[] buffer = new byte[bufferSize];

        using (var fs = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read, bufferSize, true))
        {
            int bytesRead;
            while ((bytesRead = await fs.ReadAsync(buffer.AsMemory(0, bufferSize), cts.Token)) > 0)
            {
                for (int i = 0; i < bytesRead; i++)
                {
                    byte b = buffer[i];
                    if (b >= 32 && b <= 126) sb.Append((char)b);
                    else if (b == 10) sb.Append('\n');  
                    else if (b == 13) sb.Append('\r');  
                    else if (b == 9) sb.Append('\t');   
                    else if (b < 32) { sb.Append('^'); sb.Append((char)(b + 64)); } 
                    else if (b == 127) sb.Append("^?"); // 
                    else sb.Append((char)b); // 
                }
            }
        }

        return sb.ToString();
    }
    catch (OperationCanceledException)
    {
        _logger.LogWarning("File read timed out (over 20s): {Path}", relativePath);
        throw new InvalidOperationException("File quá lớn, không đọc được trong 20 giây.");
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to read file nano style: {Path}", relativePath);
        throw;
    }
    }

    private string ConvertBinaryToNanoStyle(byte[] bytes)
        {
            var sb = new StringBuilder(bytes.Length * 2);

            foreach (byte b in bytes)
            {
                if (b >= 32 && b <= 126)
                {
                    sb.Append((char)b);
                }
                else if (b == 10)
                {
                    sb.Append("\n");
                }
                else if (b == 13)
                {
                    sb.Append("\r");
                }
                else if (b == 9)
                {
                    sb.Append("\t");
                }
                else if (b < 32)
                {
                    sb.Append("^");
                    sb.Append((char)(b + 64)); // ^@ ^A ^B ... giống nano
                }
                else if (b == 127)
                {
                    sb.Append("^?");
                }
                else
                {
                    sb.Append("\\x");
                    sb.Append(b.ToString("X2")); // ký tự >127 thì escape dạng \xFF
                }
            }

            return sb.ToString();
        }

    }
