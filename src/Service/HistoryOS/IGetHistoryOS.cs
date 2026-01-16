using OSManager.Models;

namespace OSManager.Service.HistoryOS;

public interface IGetHistoryOS
{
    Task<List<LogEntry>> GetAllHistoryAsync();
}