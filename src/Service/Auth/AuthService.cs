using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;
using OSManager.API.Models;
using OSManager.Core.Core.Helpers;
using OSManager.Models;
using OSManager.Provider.JWTProvider;
using OSManager.Service.HistoryOS;
using Renci.SshNet;

namespace OSManager.Service.Auth;

public class AuthService:IAuthService
{
    
 private readonly JwtSecretProvider _secretProvider;

    private readonly string _sshHost;
    private readonly int _sshPort;
    private readonly IHistoryQueue _queue;
    private readonly StorageService _storageService;
    public AuthService(JwtSecretProvider secretProvider, IHistoryQueue queue, StorageService storageService)
    {
        _storageService = storageService;
        _secretProvider = secretProvider;

        _sshHost = Environment.GetEnvironmentVariable("HOST_SSH_IP") ?? "127.0.0.1";
        int.TryParse(Environment.GetEnvironmentVariable("HOST_PORT"), out _sshPort);
        if (_sshPort == 0) _sshPort = 22;
        _queue = queue;
    }
    
    public async Task<AuthResult> LoginWithPasswordAsync(string username, string password)
    {
        if (!await TryAuthenticateWithPasswordAsync(username, password))
        {
            return new AuthResult
            {
                Success = false,
                StatusCode = 401,
                Error = "Sai username hoặc password."
            };
        }

        return ValidateUserAndCreateResponse(username);
    }

    public async Task<AuthResult> LoginWithSshKeyAsync(string username, string sshPrivateKey, string? sshKeyPassphrase)
    {
        if (!await TryAuthenticateWithPrivateKeyAsync(username, sshPrivateKey, sshKeyPassphrase))
        {
            return new AuthResult
            {
                Success = false,
                StatusCode = 401,
                Error = "SSH private key không hợp lệ."
            };
        }

        return ValidateUserAndCreateResponse(username);
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
            return "root";

        var users = _storageService.GetAllUsers();
        var user = users.FirstOrDefault(u =>
            string.Equals(u["username"]?.ToString(), username, StringComparison.OrdinalIgnoreCase));

        if (user == null)
            throw new Exception("User không tồn tại trong hệ thống.");
        bool canUseOS = false;

        if (user.TryGetValue("CanUseOSManagement", out var raw) && raw is JsonElement je)
        {
            if (je.ValueKind == JsonValueKind.True) canUseOS = true;
            else if (je.ValueKind == JsonValueKind.False) canUseOS = false;
        }
        else if (raw is bool b) 
        {
            canUseOS = b;
        }

        if (!canUseOS)
            throw new Exception("Không có quyền truy cập OS Manager.");

        return "user";
    }
    
    private AuthResult ValidateUserAndCreateResponse(string username)
    {
        if (string.Equals(username, "root", StringComparison.OrdinalIgnoreCase))
        {
            return new AuthResult
            {
                Success = true,
                StatusCode = 200,
                Response = CreateAuthResponse("root")
            };
        }
        var users = _storageService.GetAllUsers();
        var user = users.FirstOrDefault(u =>
            string.Equals(u["username"]?.ToString(), username, StringComparison.OrdinalIgnoreCase));

        if (user == null)
        {
            return new AuthResult
            {
                Success = false,
                StatusCode = 404,
                Error = "User không tồn tại trong hệ thống."
            };
        }

        bool canUseOS = false;

        if (user.TryGetValue("CanUseOSManagement", out var raw))
        {
            if (raw is JsonElement je)
            {
                if (je.ValueKind == JsonValueKind.True) canUseOS = true;
                if (je.ValueKind == JsonValueKind.False) canUseOS = false;
            }
            else if (raw is bool b)
            {
                canUseOS = b;
            }
        }

        if (!canUseOS)
        {
            return new AuthResult
            {
                Success = false,
                StatusCode = 403,
                Error = "User không có quyền truy cập OS Manager."
            };
        }

        return new AuthResult
        {
            Success = true,
            StatusCode = 200,
            Response = CreateAuthResponse(username)
        };
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