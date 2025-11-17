namespace OSManager.Service.FileService;

public interface IFileService
{
    Task<string> CreateFileAsync(string relativePath);
    Task UpdateFileContentAsync(string relativePath, string newContent);
    Task<string> ReadFileContentAsync(string relativePath);
}