using Microsoft.AspNetCore.Mvc;
using OSManager.Models;
using OSManager.Service.Auth;

namespace OSManager.API;
[ApiController]
[Route("api/[controller]")]
public class AuthController: ControllerBase
{
    
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login/password")]
    public async Task<IActionResult> LoginWithPassword([FromBody] LoginPassworkRequest model)
    {
        if (string.IsNullOrEmpty(model.Username) || string.IsNullOrEmpty(model.Password))
            return BadRequest("Username and password are required");

        var result = await _authService.LoginWithPasswordAsync(model.Username, model.Password);
        if (result == null)
            return Unauthorized("Invalid credentials");

        return Ok(result);
    }

    [HttpPost("login/sshkey")]
    public async Task<IActionResult> LoginWithSshKey([FromForm] LoginSSHKetRequest model)
    {
        if (string.IsNullOrEmpty(model.Username) || model.SshPrivateKeyFile == null)
            return BadRequest("Username and SSH key file are required");
        string privateKeyContent;
        using (var reader = new StreamReader(model.SshPrivateKeyFile.OpenReadStream()))
        {
            privateKeyContent = await reader.ReadToEndAsync();
        }

        var result = await _authService.LoginWithSshKeyAsync(
            model.Username,
            privateKeyContent,
            model.SshKeyPassphrase
        );

        if (result == null)
            return Unauthorized("Invalid credentials");

        return Ok(result);
    }
}

// public class LoginRequest
// {
//     public string Username { get; set; }
//     public string Password { get; set; }
// }