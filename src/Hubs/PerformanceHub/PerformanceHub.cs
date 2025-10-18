using Microsoft.AspNetCore.SignalR;
using OSManager.Service.SystemMonitorService;

namespace OSManager.Hubs.PerformanceHub;

public class PerformanceHub: Hub
{
    private readonly IPerformanceReaderService _reader;

    public PerformanceHub(IPerformanceReaderService reader)
    {
        _reader = reader;
    }

    public async Task Subscribe()
    {
        var metrics = _reader.Read();

        await Clients.Caller.SendAsync("Subscribed", "Đã kết nối đến PerformanceHub");
        await Clients.Caller.SendAsync("ReceiveMetrics", metrics);
    }
}