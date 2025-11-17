namespace OSManager.Service.DockerService;

public interface IDockerService
{
    Task<IEnumerable<object>> GetAllImagesAsync();
    Task<IEnumerable<object>> GetAllContainersAsync();
    Task<bool> StopContainerAsync(string containerId);
    
}