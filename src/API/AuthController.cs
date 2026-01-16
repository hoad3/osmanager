using System.Text.Json;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using OSManager.Middleware;
using OSManager.Models;
using OSManager.Service.Auth;
using LoginRequest = OSManager.Models.LoginRequest;

namespace OSManager.API;
[ApiController]
[Route("api/[controller]")]
public class AuthController: ControllerBase
{
    
    private readonly IAuthService _authService;
    private readonly MiddlewareStorage _aesMiddleware;

    public AuthController(IAuthService authService, MiddlewareStorage aesMiddleware)
    {
        _aesMiddleware = aesMiddleware;
        _authService = authService;
    }
    
    // [HttpPost("login/password")]
    // public async Task<IActionResult> LoginWithPassword([FromBody] LoginPassworkRequest model)
    // {
    //     Console.WriteLine("Iv: "+ model?.Iv);
    //     Console.WriteLine("Iv: "+ model?.Cipher);
    //     string plain;
    //     try
    //     {
    //         plain = _aesMiddleware.DecryptFromBase64(model.Iv, model.Cipher);
    //     }
    //     catch (Exception ex)
    //     {
    //         // log & return 400 or 422
    //         Console.WriteLine("Decrypt error: " + ex.Message);
    //         return BadRequest("invalid payload");
    //     }
    //     Console.WriteLine("DecryptAPI: "+ plain);
    //     var login = Newtonsoft.Json.JsonConvert.DeserializeObject<LoginRequest>(plain);
    //     Console.WriteLine("login: "+ login);
    //     return Ok(await _authService.LoginWithPasswordAsync(login.Username, login.Password));
    // }
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