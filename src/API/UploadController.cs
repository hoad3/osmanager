using Microsoft.AspNetCore.Mvc;
using OSManager.Models;
using OSManager.Service.UploadService;

namespace OSManager.API;
[ApiController]
[Route("[controller]")]
public class UploadController: ControllerBase
{
    private readonly IUploadService _uploadService;

    public UploadController(IUploadService uploadService)
    {
        _uploadService = uploadService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(string relativePath, List<FileUploadModel> items)
    {
        await _uploadService.UploadMixedAsync(relativePath, items);
        
        return Ok(new { message = "Upload completed successfully" });
    }
}