namespace OSManager.Models;

public class VPSUserUpdateDto
{
    public string Username { get; set; } = "";
    public string SshPrivateKey { get; set; } = "";
    public string? SshPrivateKeyPassphrase { get; set; }
    public string SshHost { get; set; } = "127.0.0.1";
    public int SshPort { get; set; } = 22;
    public string SshUser { get; set; } = "root";
    public bool? IsRoot { get; set; }
    public bool? CanUseDocker { get; set; }
    public bool? CanUseOSManager { get; set; }
    public string[]? AllowedDirectories { get; set; }
    public string Email { get; set; } = "";
    public string Timestamp { get; set; } = "";
}