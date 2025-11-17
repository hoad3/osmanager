using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using OSManager.API.Models;
using OSManager.Core.Core.Helpers;
using OSManager.Provider.JWTProvider;
using Renci.SshNet;

namespace OSManager.Service.Auth;

public class AuthService:IAuthService
{
    
 private readonly JwtSecretProvider _secretProvider;

    private readonly string _sshHost;
    private readonly int _sshPort;

    public AuthService(JwtSecretProvider secretProvider)
    {
        _secretProvider = secretProvider;

        _sshHost = Environment.GetEnvironmentVariable("HOST_SSH_IP") ?? "127.0.0.1";
        int.TryParse(Environment.GetEnvironmentVariable("HOST_PORT"), out _sshPort);
        if (_sshPort == 0) _sshPort = 22;
    }
    
    public async Task<AuthResponse?> LoginWithPasswordAsync(string username, string password)
    {
        if (await TryAuthenticateWithPasswordAsync(username, password))
            return CreateAuthResponse(username);

        return null;
    }

    public async Task<AuthResponse?> LoginWithSshKeyAsync(string username, string sshPrivateKey, string? sshKeyPassphrase)
    {
        if (await TryAuthenticateWithPrivateKeyAsync(username, sshPrivateKey, sshKeyPassphrase))
            return CreateAuthResponse(username);

        return null;
    }
    
    private AuthResponse CreateAuthResponse(string username)
    {
        var apiKey = Core_Helpers_ApiKeyStore.GenerateKey();
        var claims = BuildClaims(username);
        var jwtToken = GenerateToken(claims);
        var role = DetermineRole(username);

        return new AuthResponse
        {
            ApiKey = apiKey,
            JwtToken = jwtToken,
            Role = role
        };
    }

    private string DetermineRole(string username)
    {
        if (string.Equals(username, "root", StringComparison.OrdinalIgnoreCase))
            return "admin";
        return "user";
    }

    private List<Claim> BuildClaims(string username)
    {
        return new List<Claim>
        {
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, DetermineRole(username))
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

    // SSH password auth
    private Task<bool> TryAuthenticateWithPasswordAsync(string username, string password)
    {
        return Task.Run(() =>
        {
            try
            {
                var connInfo = new  Renci.SshNet.ConnectionInfo(_sshHost, _sshPort, username,
                    new AuthenticationMethod[]
                    {
                        new PasswordAuthenticationMethod(username, password)
                    });

                using var client = new SshClient(connInfo);
                client.ConnectionInfo.Timeout = TimeSpan.FromSeconds(5);
                client.Connect();
                if (client.IsConnected)
                {
                    client.Disconnect();
                    return true;
                }
                return false;
            }
            catch
            {
                return false;
            }
        });
    }

    // SSH key auth
    private Task<bool> TryAuthenticateWithPrivateKeyAsync(string username, string privateKeyPem, string? passphrase)
    {
        return Task.Run(() =>
        {
            try
            {
                PrivateKeyFile keyFile;
                using (var ms = new MemoryStream(Encoding.UTF8.GetBytes(privateKeyPem)))
                {
                    keyFile = string.IsNullOrEmpty(passphrase)
                        ? new PrivateKeyFile(ms)
                        : new PrivateKeyFile(ms, passphrase);
                }

                var connInfo = new  Renci.SshNet.ConnectionInfo(_sshHost, _sshPort, username,
                    new AuthenticationMethod[]
                    {
                        new PrivateKeyAuthenticationMethod(username, new [] { keyFile })
                    });

                using var client = new SshClient(connInfo);
                client.ConnectionInfo.Timeout = TimeSpan.FromSeconds(5);
                client.Connect();
                if (client.IsConnected)
                {
                    client.Disconnect();
                    return true;
                }
                return false;
            }
            catch
            {
                return false;
            }
        });
    }
}