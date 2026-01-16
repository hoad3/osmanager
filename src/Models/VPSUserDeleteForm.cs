namespace OSManager.Models;

public class VPSUserDeleteForm
{
    public string Username { get; set; }
    public string SshUsername { get; set; }
    public IFormFile SshPrivateKeyFile { get; set; }
    public string SshPrivateKeyPassphrase { get; set; }
    public bool RemoveFromDockerGroup { get; set; }
    public bool RemoveFromSudoGroup { get; set; }
}
