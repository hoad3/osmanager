namespace OSManager.Models;

public class VPSUserCreateForm
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public bool IsRoot { get; set; } = false;
    public bool CanUseDocker { get; set; } = false;
    public bool CanUseOSManager { get; set; } = false;
    public string[] AllowedDirectories { get; set; } = Array.Empty<string>();

    public string SshHost { get; set; } = "127.0.0.1";
    public int SshPort { get; set; } = 22;
    public string SshUser { get; set; } = "root";

    public IFormFile SshPrivateKeyFile { get; set; }
    public string SshPrivateKeyPassphrase { get; set; } = null;
}