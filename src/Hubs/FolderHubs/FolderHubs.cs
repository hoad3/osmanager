using Microsoft.AspNetCore.SignalR;
using OSManager.Service.FolderService;

namespace OSManager.Hubs.FolderHubs;

public class FolderHubs : Hub
{
    private readonly IFolderService _folderService;

    public FolderHubs(IFolderService folderService)
    {
        _folderService = folderService;
    }

    public async Task AddFolder(string folderName)
    {
        if (string.IsNullOrWhiteSpace(folderName))
        {
            await Clients.Caller.SendAsync("Error", "Folder name cannot be empty.");
            return;
        }

        try
        {
            await _folderService.CreateAsync(folderName);
            var folderInfo = new { Name = folderName, Path = folderName };
            await Clients.All.SendAsync("AddFolder", folderInfo);
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("Error", ex.Message);
        }
    }
    [HubMethodName("DeleteFolder")]
    public async Task DeleteFolder(string relativePath, bool recursive = true)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            await Clients.Caller.SendAsync("Error", "Folder path cannot be empty.");
        }

        try
        {
            await _folderService.DeleteAsync(relativePath, recursive);
            var folderInfo = new { Name = relativePath, Path = relativePath };
            await Clients.All.SendAsync("DeleteFolder", folderInfo);
        }
        catch (Exception e)
        {
            await Clients.Caller.SendAsync("Error", e.Message);
        }
        return;
    }

    [HubMethodName("RenameFolder")]
    public async Task RenameFolder(string path, string newName)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            await Clients.Caller.SendAsync("Error", "Folder path cannot be empty.");
        }

        try
        {
            await _folderService.RenameAsync(path, newName);
            var fondername = new { Name = newName, Path = path };
            await Clients.All.SendAsync("RenameFolder", fondername);
        }
        catch (Exception e)
        {
            await Clients.Caller.SendAsync("Error", e.Message);
        }
        return;
    }
}