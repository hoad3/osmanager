using OSManager.Models;

namespace OSManager.Service.ReportEmailService;

public interface IHistoryReportService
{
    Task<List<LogEntry>> LoadTodayLogsAsync(DateTime now);
    Task<string> ExportExcelAsync(List<LogEntry> logs, DateTime now);
    Task SendReportEmailAsync(List<LogEntry> logs, DateTime now);
}