namespace OSManager.Models;

    public class LoginPassworkRequest
    {
        public string Username { get; set; } = "";
        public string? Password { get; set; } // VPS password (optional)

    }

    public class LoginSSHKetRequest
    {
        public string Username { get; set; } = "";
        public IFormFile SshPrivateKeyFile { get; set; } = null!;
        public string? SshKeyPassphrase { get; set; }
    }
    