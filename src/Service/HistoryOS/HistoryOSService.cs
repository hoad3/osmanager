using System.Collections.Concurrent;
using OSManager.Models;

namespace OSManager.Service.HistoryOS;

public class HistoryOSService: BackgroundService
{
    private readonly IHistoryQueue _queue;
    private readonly StorageService _storage;
    
    public HistoryOSService(IHistoryQueue queue, StorageService storage)
    {
        _queue = queue;
        _storage = storage;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var batch = new List<LogEntry>();
            while (batch.Count < 20 && _queue.TryDequeue(out var log))
            {
                batch.Add(log);
            }

            if (batch.Count > 0)
            {
                Console.WriteLine($"Writing {batch.Count} logs to JSON...");
                _storage.LogBatch(batch);
            }

            await Task.Delay(1000, stoppingToken);
        }
    }
}