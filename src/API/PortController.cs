using Microsoft.AspNetCore.Mvc;
using OSManager.Service.FirewallRule;
namespace OSManager.API;

[ApiController]
[Route("[controller]")]
public class PortController: ControllerBase
{
    private readonly IFirewallService _firewallService;

    public PortController(IFirewallService firewallService)
    {
        _firewallService = firewallService;
    }

    [HttpPost("get-ports")]
    public async Task<IActionResult> GetFirewallPorts(IFormFile sshPrivateKeyFile)
    {
        if (sshPrivateKeyFile == null || sshPrivateKeyFile.Length == 0)
            return BadRequest("SSH private key file is required");

        string privateKeyContent;
        using (var reader = new StreamReader(sshPrivateKeyFile.OpenReadStream()))
        {
            privateKeyContent = await reader.ReadToEndAsync();
        }

        var request = new FirewallRule
        {
            SshPort = 22,                
            SshUser = "root",            
            SshPrivateKey = privateKeyContent,
            RemoteCommand = "nsenter --target 1 --mount --uts --ipc --net --pid -- ss -tuln"
        };

        var result = _firewallService.GetFirewallRulesViaSsh(request);

        return Ok(result);
    }
}