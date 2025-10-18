namespace OSManager.API.Models;

public class AuthResponse
{
    public string ApiKey { get; set; } = null!;
    public string JwtToken { get; set; } = null!;
}