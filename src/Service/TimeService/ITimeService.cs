namespace OSManager.Service.TimeService;

public interface ITimeService
{
    TimeZoneInfo VietnamTimeZone { get; }
    DateTime GetVietnamNow();
    string GetVietnamNowString(string? format = null);
    DateTimeOffset GetVietnamNowOffset();
}