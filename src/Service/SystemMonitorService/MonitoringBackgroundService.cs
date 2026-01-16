using Microsoft.AspNetCore.SignalR;
using OSManager.Hubs.PerformanceHub;

namespace OSManager.Service.SystemMonitorService;

public class MonitoringBackgroundService : BackgroundService
{
    private readonly ILogger<MonitoringBackgroundService> _logger;
    private readonly PerformanceReaderService _reader = new();
    private readonly IHubContext<PerformanceHub> _hubContext;
    public MonitoringBackgroundService(ILogger<MonitoringBackgroundService> logger, IHubContext<PerformanceHub> hubContext)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try 
            {
                var metrics = _reader.Read();

                _logger.LogInformation($"CPU: {metrics.CpuUsage:F2}% | RAM: {metrics.UsedMemoryMB}/{metrics.TotalMemoryMB}MB ({metrics.MemoryUsage:F2}%) | Disk: {metrics.DiskUsedGB}/{metrics.DiskTotalGB}GB used");
                await _hubContext.Clients.All.SendAsync("ReceivePerformance", new
                {
                    CPU = $"{metrics.CpuUsage:F2}%",
                    RAM = $"{metrics.UsedMemoryMB}/{metrics.TotalMemoryMB}MB ({metrics.MemoryUsage:F2}%)",
                    Disk = $"{metrics.DiskUsedGB}/{metrics.DiskTotalGB}GB used"
                }, stoppingToken);

                await Task.Delay(1000, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in monitoring service: {ex.Message}");
                await Task.Delay(1000, stoppingToken); 
            }
        }
    }
}