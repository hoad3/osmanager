namespace OSManager.Models;

public class VPSUserDeleteDto
{
    public string Username { get; set; }
    public string SshHost { get; set; }
    public int SshPort { get; set; } = 22;
    public string SshUser { get; set; }
    public string SshPrivateKey { get; set; }
    public string SshPrivateKeyPassphrase { get; set; }
    public bool RemoveFromDockerGroup { get; set; } = true;
    public bool RemoveFromSudoGroup { get; set; } = true;
}