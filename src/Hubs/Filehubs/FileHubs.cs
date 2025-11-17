using Microsoft.AspNetCore.SignalR;
using OSManager.Service.FileService;
using System.IO;

namespace OSManager.Hubs.Filehubs;

public class FileHubs:Hub
{
    private readonly IFileService _fileService;

    public FileHubs(IFileService fileService)
    {
        _fileService = fileService;
    }

    [HubMethodName("CreateFiles")]
    public async Task CreateFiles(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            await Clients.Caller.SendAsync("Error", "file name cannot be empty.");
            return;
        }
        try
        {
            var created = await _fileService.CreateFileAsync(relativePath);
            var fileInfo = new { Name = Path.GetFileName(created), Path = created };
            await Clients.Caller.SendAsync("CreateFiles", fileInfo);
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("FileCreateError", ex.Message);
        }
    }

    [HubMethodName("UpdateFiles")]
    public async Task UpdateFiles(string relativePath, string newContent)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            await Clients.Caller.SendAsync("Error", "file name cannot be empty.");
            return;
        }
        try
        {
            var file =  _fileService.UpdateFileContentAsync(relativePath, newContent);
            var fileInfo = new { Name = relativePath, Path = relativePath };
            await Clients.Caller.SendAsync("UpdateFiles", fileInfo);
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("FileUpdateError", ex.Message);
        }
    }
}