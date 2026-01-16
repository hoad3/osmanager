namespace OSManager.Models;

public class DockerActionRequest
{
    public string? DirectoryPath { get; set; }
    public IFormFile SshKeyFile { get; set; } = null!;
    public string? Passphrase { get; set; }
    public string? Repository { get; set; }
    public string? Tag { get; set; }
    public string? containerId { get; set; }
}