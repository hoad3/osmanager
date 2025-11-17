using Microsoft.AspNetCore.Mvc;
using OSManager.Service.FileService;

namespace OSManager.API;
[Route("api/[controller]")]
public class FileController:ControllerBase
{
    private readonly IFileService _fileService;

    public FileController(IFileService fileService)
    {
        _fileService = fileService;
    }

    [HttpPost("Create-File")]
    public async Task<IActionResult> CreateFile(string relativePath)
    {
        if (relativePath == null)
        {
            return NotFound();
        }

        var results = await _fileService.CreateFileAsync(relativePath);
        return Ok(results);
    }

    [HttpPatch("Update-File")]
    public async Task<IActionResult> UpdateFile(string relativePath, string newContent)
    {
        await _fileService.UpdateFileContentAsync(relativePath, newContent);
        if (relativePath == null)
        {
            return NotFound();
        }
        
        return Ok(new { message = "File updated successfully" });
    }
    [HttpGet("Get-File")]
    public async Task<IActionResult> ReadFile(string relativePath)
    {
        var content = await _fileService.ReadFileContentAsync(relativePath);
        if (relativePath == null)
        {
            return NotFound();
        }
        
        return Ok(content);
    }
}