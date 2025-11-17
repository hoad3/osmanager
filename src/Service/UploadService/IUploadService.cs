using OSManager.Models;

namespace OSManager.Service.UploadService;

public interface IUploadService
{
    Task UploadMixedAsync(string relativePath, List<FileUploadModel> items);
}