using OSManager.API.Models;

namespace OSManager.Models;

public class AuthResult
{
    
    public bool Success { get; set; }
    public AuthResponse? Response { get; set; }
    public string? Error { get; set; }
    public int StatusCode { get; set; }
}