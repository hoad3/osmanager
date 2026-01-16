using System.Text.Json;
using OSManager.Middleware;
using OSManager.Models;
using OSManager.Service.TimeService;

namespace OSManager.Service.HistoryOS;

public class GetHistoryOS: IGetHistoryOS
{
    private readonly string _dataFolder;
    private readonly MiddlewareStorage _crypto;
    private readonly ITimeService _timeService;
    public GetHistoryOS(MiddlewareStorage crypto, ITimeService timeService)
    {
        _timeService = timeService;
        _dataFolder = "/app/storage/history";
        _crypto = crypto;
    }
    
    public async Task<List<LogEntry>> GetAllHistoryAsync()
    {
        var result = new List<LogEntry>();
        if (!Directory.Exists(_dataFolder))
            return result;

        var files = Directory.GetFiles(_dataFolder, "*.json");

        foreach (var file in files)
        {
            try
            {
                var decrypted = _crypto.DecryptFromFile(file);

                var logs = JsonSerializer.Deserialize<List<LogEntry>>(decrypted);
                if (logs != null)
                    result.AddRange(logs);
            }
            catch
            {
            }
        }
        result.Sort((a, b) => a.Timestamp.CompareTo(b.Timestamp));

        return result;
    }
}