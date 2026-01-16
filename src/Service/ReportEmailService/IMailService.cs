namespace OSManager.Service.ReportEmailService;

public interface IMailService
{
    Task SendEmailAsync(string to, string subject, string body, string? attachmentPath = null);
}