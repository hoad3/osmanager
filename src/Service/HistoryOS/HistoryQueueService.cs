using System.Collections.Concurrent;
using OSManager.Models;

namespace OSManager.Service.HistoryOS;

public class HistoryQueueService: IHistoryQueue
{
    private readonly ConcurrentQueue<LogEntry> _queue = new();

    public void Enqueue(LogEntry log) => _queue.Enqueue(log);

    public bool TryDequeue(out LogEntry log) => _queue.TryDequeue(out log);
}