using Microsoft.AspNetCore.Mvc;
using OSManager.Service.HistoryOS;

namespace OSManager.API;
[Route("api/[controller]")]
public class GetHistoryController: ControllerBase
{
    private readonly IGetHistoryOS _getHistoryOS;

    public GetHistoryController(IGetHistoryOS getHistoryOS)
    {
        _getHistoryOS = getHistoryOS;
    }

    [HttpGet("GetHistory")]
    public async Task<IActionResult> GetHistory()
    {
        var results = await _getHistoryOS.GetAllHistoryAsync();
        if (results is null) return NotFound();
        
        return Ok(results);
    }
    
}