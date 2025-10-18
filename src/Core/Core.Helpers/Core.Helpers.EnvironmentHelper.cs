using System.Diagnostics;
using System.Runtime.InteropServices;
using Microsoft.Extensions.Options;
using OSManager.API.Models;

namespace OSManager.Core.Core.Helpers;


public class Core_Helpers_EnvironmentHelper
{
    private readonly string _hostRoot;
    public Core_Helpers_EnvironmentHelper(IOptions<MountSettings> options)
    {
        _hostRoot = options.Value.HostRoot;
    }
    public string GetHostRoot() => _hostRoot;
    public string DetectedEnvironment()
    {
        var inDocker = IsRunningInDocker();
        var hostInfo = TryReadHostOSRelease();

        if (inDocker)
        {
            return $"Docker Container (Host OS: {hostInfo})";
        }
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            return "Windows (Bare metal)";
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            return "Linux (Bare metal)";
        if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            return "macOS (Bare metal)";
        return "Unknown Environment";
    }
    public void LogEnvironmentInfo(ILogger logger)
    {
        var env = DetectedEnvironment();
        var internalOsInfo = GetInternalOSInfo();

        logger.LogInformation($"[Environment] Running in: {env}");
        logger.LogInformation($"[Container OS Info]\n{internalOsInfo}");
    }
    private string TryReadHostOSRelease()
    {
        try
        {
            var osReleasePath = Path.Combine(_hostRoot, "etc", "os-release");
            if (File.Exists(osReleasePath))
            {
                var lines = File.ReadAllLines(osReleasePath);
                var nameLine = lines.FirstOrDefault(line => line.StartsWith("PRETTY_NAME="));
                return nameLine?.Split('=')[1].Trim('"') ?? "Unknown";
            }

            return "unknown (no /etc/os-release mounted)";
        }
        catch
        {
            return "unknown (failed to read host volume)";
        }
    }
    public string GetInternalOSInfo()
    {
        try
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                return RunCommand("cmd.exe", "/c ver");

            if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                return RunCommand("/bin/sh", "-c \"cat /etc/os-release\"");

            if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
                return RunCommand("/bin/sh", "-c \"sw_vers\"");

            return "Unknown OS";
        }
        catch (Exception ex)
        {
            return $"Error detecting container OS: {ex.Message}";
        }
    }
    private static bool IsRunningInDocker()
    {
        return File.Exists("/.dockerenv") || CheckCGroup();

        static bool CheckCGroup()
        {
            try
            {
                var lines = File.ReadAllLines("/proc/1/cgroup");
                return lines.Any(line => line.Contains("docker") || line.Contains("containerd"));
            }
            catch
            {
                return false;
            }
        }
    }
    private static string RunCommand(string filename, string arguments)
    {
        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = filename,
                Arguments = arguments,
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };
        process.Start();
        var output = process.StandardOutput.ReadToEnd();
        process.WaitForExit();
        return output.Trim();
    }
    public void EnsureMountedHostRootExists(ILogger logger)
    {
        if (IsRunningInDocker())
        {
            LogEnvironmentInfo(logger);
            try
            {
                if (!Directory.Exists(_hostRoot))
                {
                    Directory.CreateDirectory(_hostRoot);
                    logger.LogInformation($"[Init] Created host-mounted directory at {_hostRoot}");
                }
                else
                {
                    logger.LogInformation($"[Init] Host-mounted directory exists: {_hostRoot}");
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning($"[Init] Failed to ensure host-mounted directory: {ex.Message}");
            }
        }
        else
        {
            logger.LogInformation("[Init] Not running in Docker; skipping mount directory check.");
        }
    }
}