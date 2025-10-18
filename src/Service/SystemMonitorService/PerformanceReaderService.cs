using OSManager.Models;

namespace OSManager.Service.SystemMonitorService;
public class PerformanceReaderService:IPerformanceReaderService
{
    private readonly string _procPath = "/hostproc";

    public SystemMetrics Read()
    {
        var cpuUsage = ReadCpuUsage();
        var (totalMemoryMB, usedMemoryMB, memoryUsage) = ReadMemoryUsage();
        var (diskTotalGB, diskUsedGB, diskFreeGB) = ReadDiskUsage();
        return new SystemMetrics
        {
            CpuUsage = cpuUsage,
            TotalMemoryMB = totalMemoryMB,
            UsedMemoryMB = usedMemoryMB,
            MemoryUsage = memoryUsage,
            DiskTotalGB = diskTotalGB,
            DiskUsedGB = diskUsedGB,
            DiskFreeGB = diskFreeGB
        };
    }

    private float ReadCpuUsage()
    {
        string[] cpuLine1 = File.ReadLines(Path.Combine(_procPath, "stat")).First().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        Thread.Sleep(500);
        string[] cpuLine2 = File.ReadLines(Path.Combine(_procPath, "stat")).First().Split(' ', StringSplitOptions.RemoveEmptyEntries);

        long idle1 = long.Parse(cpuLine1[4]);
        long total1 = cpuLine1.Skip(1).Take(10).Sum(s => long.Parse(s));

        long idle2 = long.Parse(cpuLine2[4]);
        long total2 = cpuLine2.Skip(1).Take(10).Sum(s => long.Parse(s));

        long totalDiff = total2 - total1;
        long idleDiff = idle2 - idle1;

        return 100f * (1f - (float)idleDiff / totalDiff);
    }

    private (int TotalMB, int UsedMB, float PercentUsed) ReadMemoryUsage()
    {
        var lines = File.ReadAllLines(Path.Combine(_procPath, "meminfo"));

        long memTotal = ExtractKb(lines, "MemTotal");
        long memFree = ExtractKb(lines, "MemFree");
        long buffers = ExtractKb(lines, "Buffers");
        long cached = ExtractKb(lines, "Cached");

        long used = memTotal - (memFree + buffers + cached);

        int usedMB = (int)(used / 1024);
        int totalMB = (int)(memTotal / 1024);
        float percent = 100f * used / memTotal;

        return (totalMB, usedMB, percent);
    }

    private long ExtractKb(string[] lines, string key)
    {
        var line = lines.FirstOrDefault(l => l.StartsWith(key));
        if (line == null) return 0;

        var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return long.Parse(parts[1]);
    }

    private (long TotalGB, long UsedGB, long FreeGB) ReadDiskUsage()
    {
        var drive = new DriveInfo("/");
        long totalGB = drive.TotalSize / (1024 * 1024 * 1024);
        long freeGB = drive.AvailableFreeSpace / (1024 * 1024 * 1024);
        long usedGB = totalGB - freeGB;
        return (totalGB, usedGB, freeGB);
    }
}