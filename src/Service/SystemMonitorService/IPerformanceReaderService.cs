using OSManager.Models;

namespace OSManager.Service.SystemMonitorService;

public interface IPerformanceReaderService
{
    SystemMetrics Read();
}