using Microsoft.AspNetCore.Mvc;
using OSManager.Service.DockerService;

namespace OSManager.API;

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
}