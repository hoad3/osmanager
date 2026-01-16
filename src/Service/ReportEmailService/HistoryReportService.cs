using System.Text.Json;
using ClosedXML.Excel;
using OSManager.Middleware;
using OSManager.Models;
using OSManager.Service.HistoryOS;
using OSManager.Service.TimeService;

namespace OSManager.Service.ReportEmailService;

public class HistoryReportService: IHistoryReportService
{
    private readonly IServiceProvider _provider;
    private readonly MiddlewareStorage _crypto;
    private readonly IHistoryQueue _queue;
    private readonly ITimeService _timeService;

    public HistoryReportService(IServiceProvider provider, MiddlewareStorage crypto, IHistoryQueue queue, ITimeService timeService)
    {
        _timeService = timeService;
        _provider = provider;
        _crypto = crypto;
        _queue = queue;
    }
    public async Task<List<LogEntry>> LoadTodayLogsAsync(DateTime now)
    {
        string fileName = $"history_{now:yyyyMMdd}.json";
        string filePath = Path.Combine("/app/storage/history", fileName);

        if (!File.Exists(filePath))
            return new List<LogEntry>();

        string decrypted = _crypto.DecryptFromFile(filePath);
        var logs = JsonSerializer.Deserialize<List<LogEntry>>(decrypted);

        return logs ?? new List<LogEntry>();
    }
    public async Task<string> ExportExcelAsync(List<LogEntry> logs, DateTime now)
    {
        string exportFolder = "/app/storage/export";
        Directory.CreateDirectory(exportFolder);

        string outPath = Path.Combine(exportFolder, $"history_{now:yyyyMMdd}.xlsx");

        using var workbook = new XLWorkbook();
        var sheet = workbook.AddWorksheet("History");

        sheet.Cell(1, 1).Value = "Timestamp";
        sheet.Cell(1, 2).Value = "Action";
        sheet.Cell(1, 3).Value = "Target";
        sheet.Cell(1, 4).Value = "Detail";

        int row = 2;

        foreach (var log in logs)
        {
            sheet.Cell(row, 1).Value = log.Timestamp.DateTime;
            sheet.Cell(row, 2).Value = log.Action;
            sheet.Cell(row, 3).Value = log.Target;
            sheet.Cell(row, 4).Value = log.Details;
            row++;
        }

        workbook.SaveAs(outPath);
        return outPath;
    }
    public async Task SendReportEmailAsync(List<LogEntry> logs, DateTime now)
    {
        using var scope = _provider.CreateScope();

        var storageService = scope.ServiceProvider.GetRequiredService<StorageService>();
        var mailService = scope.ServiceProvider.GetRequiredService<IMailService>();

        string excelPath = await ExportExcelAsync(logs, now);

        var users = storageService.GetAllUsers()
            .Where(u => u.ContainsKey("Email") && !string.IsNullOrWhiteSpace(u["Email"]?.ToString()))
            .ToList();

        foreach (var user in users)
        {
            await mailService.SendEmailAsync(
                to: user["Email"].ToString(),
                subject: $"Lịch sử hệ thống ngày {now:dd/MM/yyyy}",
                body: "Đây là file lịch sử hoạt động trong ngày.",
                attachmentPath: excelPath
            );

            _queue.Enqueue(new LogEntry
            {
                Action = "Send Email",
                Target = excelPath,
                Details = $"Gửi email đến {user["Email"]}",
                Timestamp = _timeService.GetVietnamNowOffset()
            });
        }
    }
    
}