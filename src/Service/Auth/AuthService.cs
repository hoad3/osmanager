using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using OSManager.API.Models;
using OSManager.Core.Core.Helpers;
using OSManager.Provider.JWTProvider;

namespace OSManager.Service.Auth;

public class AuthService:IAuthService
{
    
    private readonly JwtSecretProvider _secretProvider;
    
    public AuthService(JwtSecretProvider secretProvider)
    {
        _secretProvider = secretProvider;
    }
    public async Task<AuthResponse?> LoginAsync(string username, string password)
    {
        var (adminUser, adminPass) = GetCredentialsFromEnv();

        if (!ValidateCredentials(username, password, adminUser, adminPass))
            return null;

        var apiKey = Core_Helpers_ApiKeyStore.GenerateKey();
        var claims = BuildClaims(username);
        var jwtToken = GenerateToken(claims);

        return await Task.FromResult(new AuthResponse
        {
            ApiKey = apiKey,
            JwtToken = jwtToken
        });
    }

    private (string Username, string Password) GetCredentialsFromEnv()
    {
        var user = Environment.GetEnvironmentVariable("ADMIN_USERNAME") ?? "admin";
        var pass = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? "secret123";
        return (user, pass);
    }

    private bool ValidateCredentials(string inputUser, string inputPass, string envUser, string envPass)
    {
        return inputUser == envUser && inputPass == envPass;
    }

    private List<Claim> BuildClaims(string username)
    {
        return new List<Claim>
        {
            new Claim(ClaimTypes.Name, username),
        };
    }
    
    private string GenerateToken(IEnumerable<Claim> claims)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretProvider.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: "OSManager",
            audience: "OSManagerUsers",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}