using OSManager.Models;

namespace OSManager.Service.UploadService;

public interface IUploadService
{
    Task UploadItemsAsync(string relativePath, List<FileUploadModel> items);
}