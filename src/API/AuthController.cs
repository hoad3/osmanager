using Microsoft.AspNetCore.Mvc;
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

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest model)
    {
        var token = await _authService.LoginAsync(model.Username, model.Password);
        if (token == null)
            return Unauthorized("Invalid credentials");

        return Ok(new { token });
    }
}

public class LoginRequest
{
    public string Username { get; set; }
    public string Password { get; set; }
}