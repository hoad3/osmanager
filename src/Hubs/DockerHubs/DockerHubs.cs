using Microsoft.AspNetCore.SignalR;
using OSManager.Service.DockerService;

namespace OSManager.Hubs.DockerHubs;

public class DockerHubs:Hub
{
    private readonly IDockerService _dockerService;


    public DockerHubs(IDockerService dockerService)
    {
        _dockerService = dockerService;
    }

    [HubMethodName("GetDockerContainers")]
    public async Task GetDockerContainers()
    {
        try
        {
            var containers = await _dockerService.GetAllContainersAsync();
            await Clients.Caller.SendAsync("GetDockerContainers", containers);
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("DockerErrorContainer", new
            {
                message = "Không thể lấy danh sách container.",
                detail = ex.Message,
                time = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            });
        }
    }

    [HubMethodName("GetDockerImages")]
    public async Task GetDockerImages()
    {
        try
        {
            var images = await _dockerService.GetAllImagesAsync();
            await Clients.Caller.SendAsync("GetDockerImages", images);
        }
        catch (Exception e)
        {
            await Clients.Caller.SendAsync("DockerErrorImages", new
            {
                message = "Không thể lấy danh sách Images",
                detail = e.Message,
            });
        }
    }
}