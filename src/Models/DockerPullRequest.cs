namespace OSManager.Models;

public class DockerPullRequest
{
    public string Repository { get; set; } = default!;
    public IFormFile SshKeyFile { get; set; } = default!;
    public string? Passphrase { get; set; }
}