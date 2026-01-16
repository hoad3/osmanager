using System.Text.Json;
using OSManager.Middleware;
using OSManager.Models;
using OSManager.Service.TimeService;

namespace OSManager.Service.HistoryOS;

public class StorageService
{
    private readonly string _storagePath;
    private readonly string _historyPath;
    private readonly string _userPath;
    private readonly string _dockerPath;
    private readonly MiddlewareStorage _crypto;
    private readonly TimeZoneInfo _tz;
    private readonly ITimeService _timeService;

    public StorageService(IWebHostEnvironment env, MiddlewareStorage crypto, ITimeService timeService)
    {
        _timeService = timeService;
        _storagePath = Path.Combine(env.ContentRootPath, "storage");
        _historyPath = Path.Combine(_storagePath, "history");
        _userPath = Path.Combine(_storagePath, "user");
        _dockerPath = Path.Combine(_storagePath, "docker");
        _crypto = crypto;

        try
        {
            _tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh"); 
        }
        catch
        {
            _tz = TimeZoneInfo.Local;
        }
    }

    public void Initialize()
    {
        Directory.CreateDirectory(_historyPath);
        Directory.CreateDirectory(_userPath);
        Directory.CreateDirectory(_dockerPath);
        CleanupOldHistoryFiles();
    }


    public void LogBatch(IEnumerable<LogEntry> logs)
    {
        if (!logs.Any()) return;

        var now = TimeZoneInfo.ConvertTime(DateTime.UtcNow, _tz);
        string fileName = $"history_{now:yyyyMMdd}.json";
        string filePath = Path.Combine(_historyPath, fileName);

        List<LogEntry> existingLogs = new();
        if (File.Exists(filePath))
        {
            try
            {
                var decryptedJson = _crypto.DecryptFromFile(filePath);
                existingLogs = JsonSerializer.Deserialize<List<LogEntry>>(decryptedJson) ?? new List<LogEntry>();
            }
            catch
            {
                existingLogs = new List<LogEntry>();
            }
        }
        var nowVn = _timeService.GetVietnamNowOffset();
        foreach (var log in logs)
        {
            log.Timestamp = nowVn;
            existingLogs.Add(log);
        }

        var rawJson = JsonSerializer.Serialize(existingLogs, new JsonSerializerOptions { WriteIndented = true });
        _crypto.EncryptToFile(filePath, rawJson);

        CleanupOldHistoryFiles();
    }

    private void CleanupOldHistoryFiles()
    {
        var files = Directory.GetFiles(_historyPath, "history_*.json");
        var now = TimeZoneInfo.ConvertTime(DateTime.UtcNow, _tz);

        foreach (var file in files)
        {
            string fileName = Path.GetFileNameWithoutExtension(file);
            if (DateTime.TryParseExact(fileName.Substring(8), "yyyyMMdd", null,
                    System.Globalization.DateTimeStyles.None, out var fileDate))
            {
                if ((now - fileDate).TotalDays > 7)
                {
                    try
                    {
                        File.Delete(file);
                    }
                    catch
                    {
                    }
                }
            }
        }
    }

    public void LogUserInformation(string username, object userData)
    {
        if (string.IsNullOrWhiteSpace(username) || userData == null)
            throw new ArgumentException("Tên người dùng và userData là bắt buộc.");

        string fileName = $"information_{username}.json";
        string filePath = Path.Combine(_userPath, fileName);

        Dictionary<string, object> existingData = new();

        if (File.Exists(filePath))
        {
            try
            {
                var decryptedJson = _crypto.DecryptFromFile(filePath);
                existingData = JsonSerializer.Deserialize<Dictionary<string, object>>(decryptedJson)
                               ?? new Dictionary<string, object>();
            }
            catch
            {
                existingData = new Dictionary<string, object>();
            }
        }

        existingData["username"] = username;
        existingData["lastUpdated"] = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
        var userDict = userData as IDictionary<string, object> ??
                       JsonSerializer.Deserialize<Dictionary<string, object>>(JsonSerializer.Serialize(userData));
        if (userDict != null)
        {
            foreach (var kv in userDict)
            {
                existingData[kv.Key] = kv.Value;
            }
        }

        try
        {
            var json = JsonSerializer.Serialize(existingData, new JsonSerializerOptions { WriteIndented = true });
            _crypto.EncryptToFile(filePath, json);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to write user information for {username}: {ex.Message}");
        }

    }

    public void DeleteUserInformation(string username)
    {
        if (string.IsNullOrWhiteSpace(username))
            throw new ArgumentException("Username is required.");

        string filePath = Path.Combine(_userPath, $"information_{username}.json");

        if (File.Exists(filePath))
        {
            try
            {
                File.Delete(filePath);
                Console.WriteLine($"Thông tin người dùng '{username}' đã được xóa.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Thất bại khi xóa thông tin người dùng '{username}': {ex.Message}");
            }
        }
        else
        {
            Console.WriteLine($"Không tìm thấy thông tin người dùng '{username}' để xóa.");
        }
    }

    public List<Dictionary<string, object>> GetAllUsers()
    {
        var result = new List<Dictionary<string, object>>();
        if (!Directory.Exists(_userPath))
            return result;
        var files = Directory.GetFiles(_userPath, "*.json");
        foreach (var file in files)
        {
            try
            {
                var decrypted = _crypto.DecryptFromFile(file);
                if (string.IsNullOrWhiteSpace(decrypted))
                    continue;
                var userDict = JsonSerializer.Deserialize<Dictionary<string, object>>(decrypted);
                if (userDict != null && userDict.Count > 0)
                    result.Add(userDict);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Thất bại khi đọc file: '{file}': {ex.Message}");
            }
        }
        result.Sort((a, b) =>
        {
            a.TryGetValue("username", out var ua);
            b.TryGetValue("username", out var ub);
            return string.Compare(ua?.ToString(), ub?.ToString(), StringComparison.OrdinalIgnoreCase);
        });

        return result;
    }
    
    public Dictionary<string, object>? GetUserInfo(string username)
    {
        if (string.IsNullOrWhiteSpace(username)) return null;

        string filePath = Path.Combine(_userPath, $"information_{username}.json");
        if (!File.Exists(filePath)) return null;

        try
        {
            var decrypted = _crypto.DecryptFromFile(filePath);
            if (string.IsNullOrWhiteSpace(decrypted)) return null;

            return JsonSerializer.Deserialize<Dictionary<string, object>>(decrypted);
        }
        catch
        {
            return null;
        }
    }
    
    public void SaveDockerContainerData(string containerId, object containerData)
    {
        if (string.IsNullOrWhiteSpace(containerId) || containerData == null)
            throw new ArgumentException("ContainerId và dữ liệu container là bắt buộc.");

        string fileName = $"{containerId}.json";
        string filePath = Path.Combine(_dockerPath, fileName);
        Dictionary<string, object> writeData;
        if (containerData is Dictionary<string, object> dict1)
        {
            writeData = new Dictionary<string, object>(dict1);
        }
        else if (containerData is IDictionary<string, object> dict2)
        {
            writeData = dict2.ToDictionary(k => k.Key, v => v.Value);
        }
        else
        {
            writeData = JsonSerializer.Deserialize<Dictionary<string, object>>(
                JsonSerializer.Serialize(containerData)
            ) ?? new Dictionary<string, object>();
        }
        writeData["containerId"] = containerId;
        writeData["lastUpdated"] = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
        var json = JsonSerializer.Serialize(writeData, new JsonSerializerOptions
        {
            WriteIndented = true
        });

        _crypto.EncryptToFile(filePath, json);
    }
    
    public List<Dictionary<string, object>> GetAllDockerContainers()
    {
        var result = new List<Dictionary<string, object>>();

        if (!Directory.Exists(_dockerPath))
            return result;

        var files = Directory.GetFiles(_dockerPath, "*.json");

        foreach (var file in files)
        {
            try
            {
                var decrypted = _crypto.DecryptFromFile(file);
                if (string.IsNullOrWhiteSpace(decrypted)) continue;

                var data = JsonSerializer.Deserialize<Dictionary<string, object>>(decrypted);
                if (data != null && data.Count > 0)
                    result.Add(data);
            }
            catch { }
        }

        return result;
    }
    
    public void DeleteDockerContainerData(string containerId)
    {
        if (string.IsNullOrWhiteSpace(containerId))
            throw new ArgumentException("ContainerId là bắt buộc.");

        string filePath = Path.Combine(_dockerPath, $"{containerId}.json");

        if (File.Exists(filePath))
        {
            try
            {
                File.Delete(filePath);
                Console.WriteLine($"Thông tin container '{containerId}' đã được xóa.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Thất bại khi xóa thông tin container '{containerId}': {ex.Message}");
            }
        }
        else
        {
            Console.WriteLine($"Không tìm thấy thông tin container '{containerId}' để xóa.");
        }
    }
}
