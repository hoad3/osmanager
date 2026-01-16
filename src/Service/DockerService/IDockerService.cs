namespace OSManager.Service.DockerService;

public interface IDockerService
{
    Task<IEnumerable<object>> GetAllImagesAsync();
    Task<IEnumerable<object>> GetAllContainersAsync();
    Task<string> StartContainersAsync(string directoryPath, string sshPrivateKey, string? passphrase = null);
    Task<string> StopContainersAsync(string containerId, string sshPrivateKey, string? passphrase = null);
    Task<string> RemoveImageByNameAsync(string repository, string tag, string sshPrivateKey, string? passphrase = null);
    Task<string> LoadImageFromTarAsync(string directoryPath, string sshPrivateKey, string? passphrase = null);
    Task<string> PullImageAsync(string repository, string sshPrivateKey, string? passphrase = null);

}