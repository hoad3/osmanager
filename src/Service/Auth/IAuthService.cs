using OSManager.API.Models;

namespace OSManager.Service.Auth;

public interface IAuthService
{
    Task<AuthResponse?> LoginWithPasswordAsync(string username, string password);
    Task<AuthResponse?> LoginWithSshKeyAsync(string username, string sshPrivateKey, string? sshKeyPassphrase);
}