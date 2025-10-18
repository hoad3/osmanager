using System.Security.Cryptography;

namespace OSManager.Provider.JWTProvider;

public class JwtSecretProvider
{
    public string SecretKey { get; }

    public JwtSecretProvider()
    {
        var fromEnv = Environment.GetEnvironmentVariable("JWT_SECRET");
        if (!string.IsNullOrWhiteSpace(fromEnv))
        {
            SecretKey = fromEnv;
            return;
        }
        var keyBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(keyBytes);
        SecretKey = Convert.ToBase64String(keyBytes);
    }
}