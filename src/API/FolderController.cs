using Microsoft.AspNetCore.Mvc;
using OSManager.Service.FolderService;

namespace OSManager.API;
[ApiController]
[Route("api/[controller]")]
public class FolderController:ControllerBase
{
    private readonly IFolderService _folderService;

    public FolderController(IFolderService folderService)
    {
        _folderService = folderService;
    }
    
    [HttpPost("create")]
    public async Task<IActionResult> CreateFolderAsync(string path)
    {
        try
        {
            await _folderService.CreateAsync(path);
            return Ok(new { message = "Folder created", path });
        } catch (DirectoryNotFoundException)
        {
            return NotFound(new { error = "Parent path not found" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
    [HttpDelete("delete")]
    public async Task<IActionResult> DeleteFolderAsync([FromQuery] string relativePath, [FromQuery] bool recursive = true)
    {
         if (string.IsNullOrWhiteSpace(relativePath))
            return BadRequest(new { error = "Path is required." });
        try
        {
            await _folderService.DeleteAsync(relativePath, recursive);
            return Ok(new { message = "Folder deleted", relativePath });
        }
        catch (DirectoryNotFoundException)
        {
            return NotFound(new { error = "Folder not found", relativePath });
        }
        catch (IOException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403, new { error = "Access denied to path.", relativePath });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
    
    [HttpPut("rename")]
    public async Task<IActionResult> RenameFolderAsync(string path, string newName)
    {
        try
        {
            await _folderService.RenameAsync(path, newName);
            return Ok(new { message = "Folder renamed", path });
        }
        catch (DirectoryNotFoundException)
        {
            return NotFound(new { error = "Folder not found", path });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}