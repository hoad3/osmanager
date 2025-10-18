namespace OSManager.Core.Core.Helpers;

public class Core_Helpers_ApiKeyStore
{
    private static readonly HashSet<string> _validApiKeys = new();

    public static string GenerateKey()
    {
        var key = Guid.NewGuid().ToString();
        _validApiKeys.Add(key);
        return key;
    }

    public static bool IsValid(string key) => _validApiKeys.Contains(key);

    public static void Revoke(string key) => _validApiKeys.Remove(key);
}