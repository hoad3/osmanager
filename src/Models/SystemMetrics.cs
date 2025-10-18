namespace OSManager.Models;

public class SystemMetrics
{
    public float CpuUsage { get; set; }         
    public float MemoryUsage { get; set; }      
    public int TotalMemoryMB { get; set; }
    public int UsedMemoryMB { get; set; }
    public long DiskTotalGB { get; set; }
    public long DiskUsedGB { get; set; }
    public long DiskFreeGB { get; set; }
}