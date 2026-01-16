namespace OSManager.Models;

public class VPSUserUpdateForm
{
    public string Username { get; set; } = "";
    public IFormFile SshPrivateKeyFile { get; set; } = null!;
    public string? SshPrivateKeyPassphrase { get; set; }
    public bool? IsRoot { get; set; }
    public bool? CanUseDocker { get; set; }
    public bool? CanUseOSManager { get; set; }
    public string[]? AllowedDirectories { get; set; }
    public string Email { get; set; } = "";
}