using OSManager.API.Models;
using OSManager.Models;

namespace OSManager.Service.Auth;

public interface IAuthService
{
    Task<AuthResult> LoginWithPasswordAsync(string username, string password);
    Task<AuthResult> LoginWithSshKeyAsync(string username, string sshPrivateKey, string? sshKeyPassphrase);
}