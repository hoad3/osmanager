using OSManager.Models;

namespace OSManager.Service.HistoryOS;

public interface IHistoryQueue
{
    void Enqueue(LogEntry log);
    bool TryDequeue(out LogEntry log);
}