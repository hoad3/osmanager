namespace OSManager.Models;

public class FileUploadModel
{
    public string FileName { get; set; } = string.Empty;       
    // public string? Base64Data { get; set; } 
    public Stream? FileStream { get; set; } 
    public bool IsDirectory { get; set; }                       
}