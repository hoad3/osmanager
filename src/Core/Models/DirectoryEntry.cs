namespace OSManager.API.Models;

public class DirectoryEntry
{
    public string Name { get; set; }
    public string FullPath { get; set; }
    public bool IsDirectory { get; set; }
    public long? SizeInBytes { get; set; }
}