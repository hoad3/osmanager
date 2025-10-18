using OSManager.API.Models;

namespace OSManager.Service.Auth;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(string username, string password);
}