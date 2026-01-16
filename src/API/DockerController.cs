using Microsoft.AspNetCore.HttpLogging;
using Microsoft.AspNetCore.Mvc;
using OSManager.Models;
using OSManager.Service.DockerService;

namespace OSManager.API;

[Route("api/[controller]")]
public class DockerController:ControllerBase
{
    private readonly IDockerService _dockerService;

    public DockerController(IDockerService dockerService)
    {
        _dockerService = dockerService;
    }

    [HttpGet("Get-container")]
    public async Task<ActionResult> GetContainer()
    {
        var result = await _dockerService.GetAllContainersAsync();
        return Ok(result);
    }
    [HttpGet("Get-images")]
    public async Task<IActionResult> GetImages()
    {
        var result = await _dockerService.GetAllImagesAsync();
        return Ok(result);
    }

   [HttpPost("Start-Container")]
    public async Task<IActionResult> StartContainer([FromForm] DockerActionRequest req)
    {
        try
        {
            string privateKeyContent;
            using (var reader = new StreamReader(req.SshKeyFile.OpenReadStream()))
            {
                privateKeyContent = await reader.ReadToEndAsync();
            }

            var output = await _dockerService.StartContainersAsync(req.DirectoryPath!, privateKeyContent, req.Passphrase);
            var lines = output.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            return Ok(new { message = "Containers started successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("Stop-Container")]
    public async Task<IActionResult> StopContainer([FromForm] DockerActionRequest req)
    {
        try
        {
            string privateKeyContent;
            using (var reader = new StreamReader(req.SshKeyFile.OpenReadStream()))
            {
                privateKeyContent = await reader.ReadToEndAsync();
            }

            var output = await _dockerService.StopContainersAsync(req.DirectoryPath!, privateKeyContent, req.Passphrase);
            return Ok(new { message = "Containers stopped successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("Load-Image")]
    public async Task<IActionResult> LoadImage([FromForm] DockerActionRequest req)
    {
        try
        {
            string privateKeyContent;
            using (var reader = new StreamReader(req.SshKeyFile.OpenReadStream()))
            {
                privateKeyContent = await reader.ReadToEndAsync();
            }

            var output = await _dockerService.LoadImageFromTarAsync(req.DirectoryPath!, privateKeyContent, req.Passphrase);
            return Ok(new { message = "Docker image loaded successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("Remove-Image")]
    public async Task<IActionResult> RemoveImage([FromForm] DockerActionRequest req)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(req.Repository) || string.IsNullOrWhiteSpace(req.Tag))
                return BadRequest(new { error = "Repository and Tag are required for Remove-Image." });

            string privateKeyContent;
            using (var reader = new StreamReader(req.SshKeyFile.OpenReadStream()))
            {
                privateKeyContent = await reader.ReadToEndAsync();
            }

            var output = await _dockerService.RemoveImageByNameAsync(req.Repository, req.Tag, privateKeyContent, req.Passphrase);
            return Ok(new { message = $"Image {req.Repository}:{req.Tag} removed successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
    
    [HttpPost("Pull-Image")]
    public async Task<IActionResult> PullImage([FromForm] DockerPullRequest req)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(req.Repository))
                return BadRequest(new { error = "Repository is required for Pull-Image." });
            string privateKeyContent;
            using (var reader = new StreamReader(req.SshKeyFile.OpenReadStream()))
            {
                privateKeyContent = await reader.ReadToEndAsync();
            }
            var output = await _dockerService.PullImageAsync(req.Repository, privateKeyContent, req.Passphrase);
            return Ok(new { message = $"Image {req.Repository} pulled successfully.", output });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}