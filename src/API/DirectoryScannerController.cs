using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OSManager.Service.DirectoryExplorerService;
using OSManager.Service.DirectoryService;

namespace OSManager.API;


[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DirectoryScannerController:ControllerBase
{
    private readonly IDirectoryScannerService _scanner;
    private readonly IDirectoryExplorerService _explorer;

    public DirectoryScannerController(IDirectoryScannerService scanner, IDirectoryExplorerService explorer)
    {
        _explorer = explorer;
        _scanner = scanner;
    }

    [HttpGet("scan")]
    public IActionResult Scan()
    {
        var result = _scanner.ScanDirectory();
        return Ok(result);
    }
    [HttpGet("browse")]
    public IActionResult Browse([FromQuery] string? path = null)
    {
        try
        {
            var result = _explorer.Browse(path);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (DirectoryNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }
}