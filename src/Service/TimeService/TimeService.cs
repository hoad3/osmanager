namespace OSManager.Service.TimeService;

public class TimeService: ITimeService
{
    private readonly TimeZoneInfo _vietnamTimeZone;
    public TimeZoneInfo VietnamTimeZone => _vietnamTimeZone;
    public TimeService()
    {
        _vietnamTimeZone = LoadVietnamTimeZone();
    }

    private static TimeZoneInfo LoadVietnamTimeZone()
    {
        const string linuxZone = "Asia/Ho_Chi_Minh";
        const string windowsZone = "SE Asia Standard Time";

        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(linuxZone);
        }
        catch
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(windowsZone);
            }
            catch
            {
                return TimeZoneInfo.CreateCustomTimeZone("VN_Time", TimeSpan.FromHours(7), "Vietnam Time", "Vietnam Time");
            }
        }
    }

    public DateTime GetVietnamNow()
    {
        var vnNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _vietnamTimeZone);
        Console.WriteLine("VN Now: " + vnNow);
        return vnNow;
    }
    public DateTimeOffset GetVietnamNowOffset()
    {
        var vnNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _vietnamTimeZone);
        return new DateTimeOffset(vnNow, _vietnamTimeZone.BaseUtcOffset);
    }

    public string GetVietnamNowString(string? format = null)
    {
        format ??= "yyyy-MM-dd HH:mm:ss";
        return GetVietnamNowOffset().ToString(format);
    }
}