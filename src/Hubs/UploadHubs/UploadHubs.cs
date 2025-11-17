using Microsoft.AspNetCore.SignalR;
using OSManager.Models;
using OSManager.Service.UploadService;

namespace OSManager.Hubs.UploadHubs;

public class UploadHubs: Hub
{
    private readonly IUploadService _uploadService;

    public UploadHubs(IUploadService uploadService)
    {
        _uploadService = uploadService;
    }

    [HubMethodName("Uploads")]
    public async Task UploadFile(string relativePath, List<FileUploadModel> items)
    {
        if (string.IsNullOrEmpty(relativePath))
        {
            await Clients.All.SendAsync("UploadeError", "Path is empty");
            return;
        }
        try
        {
            await _uploadService.UploadMixedAsync(relativePath, items);
            await Clients.All.SendAsync("Uploads",  "Upload successful");
        }
        catch (Exception ex)
        {
            await Clients.All.SendAsync("UploadeError", ex.Message);
        }
    }
}