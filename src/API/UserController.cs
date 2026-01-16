using Microsoft.AspNetCore.Mvc;
using OSManager.Models;
using OSManager.Service.HistoryOS;
using OSManager.Service.UserService;

namespace OSManager.API;
[Route("api/[controller]")]
public class UserController:ControllerBase
{
    private readonly UserService _vpsUserService;
    private readonly StorageService _storageService;
    public UserController(UserService vpsUserService, StorageService storageService)
    {
        _storageService = storageService;
        _vpsUserService = vpsUserService;
    }

    [HttpPost("CreateUser")]
    public async Task<IActionResult> CreateUser([FromForm] VPSUserCreateForm form)
    {
        if (form.SshPrivateKeyFile == null || form.SshPrivateKeyFile.Length == 0)
            return BadRequest("SSH private key file required");

        string privateKeyContent;
        using (var reader = new StreamReader(form.SshPrivateKeyFile.OpenReadStream()))
        {
            privateKeyContent = await reader.ReadToEndAsync();
        }

        var dto = new VPSUserCreateDto
        {
            Username = form.Username,
            Password = form.Password,
            IsRoot = form.IsRoot,
            CanUseDocker = form.CanUseDocker,
            CanUseOSManagement = form.CanUseOSManager,
            AllowedDirectories = form.AllowedDirectories ?? new string[0],
            SshHost = Environment.GetEnvironmentVariable("HOST_SSH_IP") ?? "127.0.0.1",
            SshPort = 22,
            SshUser = "root",
            SshPrivateKey = privateKeyContent,
            SshPrivateKeyPassphrase = form.SshPrivateKeyPassphrase
        };

        _vpsUserService.CreateUser(dto);

        return Ok(new { message = "User created successfully" });
    }
    
    [HttpPost("UpdateUserPermissions")]
    public async Task<IActionResult> UpdateUserPermissions([FromForm] VPSUserUpdateForm form)
    {
        if (string.IsNullOrWhiteSpace(form.Username))
            return BadRequest("Username is required");

        if (form.SshPrivateKeyFile == null || form.SshPrivateKeyFile.Length == 0)
            return BadRequest("SSH private key file is required");

        string privateKeyContent;
        using (var reader = new StreamReader(form.SshPrivateKeyFile.OpenReadStream()))
        {
            privateKeyContent = await reader.ReadToEndAsync();
        }

        var dto = new VPSUserUpdateDto
        {
            Username = form.Username,
            SshPrivateKey = privateKeyContent,
            SshPrivateKeyPassphrase = form.SshPrivateKeyPassphrase,
            SshHost = Environment.GetEnvironmentVariable("HOST_SSH_IP") ?? "127.0.0.1",
            SshPort = 22,
            IsRoot = form.IsRoot,
            CanUseDocker = form.CanUseDocker,
            CanUseOSManager = form.CanUseOSManager,
            AllowedDirectories = form.AllowedDirectories,
            Email = form.Email,
        };

        _vpsUserService.UpdateUserPermissions(dto);

        return Ok(new { message = "User permissions updated successfully" });
    }

    [HttpGet("GetUser")]
    public async Task<IActionResult> GetUser()
    {
        var results = _storageService.GetAllUsers();
        return Ok(results);
    }
    
    [HttpPost("DeleteUser")]
    public async Task<IActionResult> DeleteUser([FromForm] VPSUserDeleteForm form)
    {
        if (string.IsNullOrWhiteSpace(form.Username))
            return BadRequest("Username is required");

        if (form.SshPrivateKeyFile == null || form.SshPrivateKeyFile.Length == 0)
            return BadRequest("SSH private key file is required");

        string privateKeyContent;
        using (var reader = new StreamReader(form.SshPrivateKeyFile.OpenReadStream()))
        {
            privateKeyContent = await reader.ReadToEndAsync();
        }

        var dto = new VPSUserDeleteDto
        {
            Username = form.Username,
            SshPrivateKey = privateKeyContent,
            SshPrivateKeyPassphrase = form.SshPrivateKeyPassphrase,
            SshHost = Environment.GetEnvironmentVariable("HOST_SSH_IP") ?? "127.0.0.1",
            SshPort = 22,
            SshUser = form.SshUsername,
            RemoveFromDockerGroup = form.RemoveFromDockerGroup,
            RemoveFromSudoGroup = form.RemoveFromSudoGroup
        };

        _vpsUserService.DeleteUser(dto);

        return Ok(new { message = $"User '{form.Username}' deleted successfully" });
    }
    
}