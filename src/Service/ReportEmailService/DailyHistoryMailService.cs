using System.Text.Json;
using ClosedXML.Excel;
using MailKit;
using OSManager.Middleware;
using OSManager.Models;
using OSManager.Service.HistoryOS;
using OSManager.Service.TimeService;

namespace OSManager.Service.ReportEmailService;

public class DailyHistoryMailService: IHostedService, IDisposable
{
    private readonly IHistoryReportService _reportService;
    private readonly ITimeService _timeService;
    private Timer? _timer;
    private readonly int _hour = 23; 
    private readonly int _minute = 30; 

    public DailyHistoryMailService(IHistoryReportService reportService, ITimeService timeService)
    {
        _reportService = reportService;
        _timeService = timeService;
    }

  
    public Task StartAsync(CancellationToken cancellationToken)
    {
        ScheduleNextRun();
        return Task.CompletedTask;
    }

    private void ScheduleNextRun()
    {
        var now = _timeService.GetVietnamNow();
        var nextRun = new DateTime(now.Year, now.Month, now.Day, _hour, _minute, 0);
        if (now >= nextRun)
            nextRun = nextRun.AddDays(1);
        var delay = nextRun - now;
        _timer = new Timer(async _ =>
        {
            await RunDailyTask();
            ScheduleNextRun();
        }, null, delay, Timeout.InfiniteTimeSpan);
    }

    private async Task RunDailyTask()
    {
        try
        {
            var now = _timeService.GetVietnamNow();
            var logs = await _reportService.LoadTodayLogsAsync(now);

            if (logs.Count == 0)
            {
                Console.WriteLine("Không có log history hôm nay.");
                return;
            }

            await _reportService.SendReportEmailAsync(logs, now);
            Console.WriteLine($"Daily History Mail Service đã chạy vào {now:yyyy-MM-dd HH:mm:ss}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Lỗi khi chạy DailyHistoryMailService: {ex.Message}");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _timer?.Change(Timeout.Infinite, 0);
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _timer?.Dispose();
    }
}