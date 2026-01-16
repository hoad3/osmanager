namespace OSManager.Models;

public class UserContext
{
    public string HomePath { get; set; } = "/";
    public string Username { get; set; } = "unknown";
    
    public bool IsRoot => string.Equals(Username, "root", StringComparison.OrdinalIgnoreCase);
}