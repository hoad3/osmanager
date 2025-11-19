using Microsoft.AspNetCore.Mvc;
using OSManager.Models;
using OSManager.Service.UploadService;

namespace OSManager.API;
[ApiController]
[Route("api/[controller]")]
public class UploadController: ControllerBase
{
    private readonly IUploadService _uploadService;

    public UploadController(IUploadService uploadService)
    {
        _uploadService = uploadService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromQuery] string relativePath)
    {
        if (!Request.HasFormContentType)
            return BadRequest("Yêu cầu phải có FormData.");

        var form = await Request.ReadFormAsync();
        var files = form.Files;
        var items = new List<FileUploadModel>();

        foreach (var file in files)
        {
            items.Add(new FileUploadModel
            {
                FileName = file.FileName,
                IsDirectory = false,
                FileStream = file.OpenReadStream()
            });
        }
        
        await _uploadService.UploadItemsAsync(relativePath, items);
        return Ok(new { message = "Upload thành công" });
    }
}