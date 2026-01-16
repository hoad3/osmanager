// using Duende.IdentityServer.Models;
// using Microsoft.AspNetCore.Mvc;
// using OSManager.Service.ReportEmailService;
//
// namespace OSManager.API;
//
// public class SendEmailController:ControllerBase
// {
//     private IHistoryReportService _historyReportService;
//
//     public SendEmailController(IHistoryReportService historyReportService)
//     {
//         _historyReportService = historyReportService;
//     }
//
//     [HttpPost("SendEmail")]
//     public async Task<ActionResult> SendEmail()
//     {
//         var results = await _historyReportService.SendReportEmailAsync();
//     }
// }