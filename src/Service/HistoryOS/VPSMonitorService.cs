using System.Diagnostics;
using OSManager.Models;

namespace OSManager.Service.HistoryOS;

public class VPSMonitorService
{
    private readonly IHistoryQueue _queue;
    private readonly List<FileSystemWatcher> _watchers = new();
    private readonly string[] _pathsToWatch;

    public VPSMonitorService(IHistoryQueue queue, string[] pathsToWatch = null)
    {
        _queue = queue;
        _pathsToWatch = pathsToWatch ?? new string[] { "/home", "/var/www", "/root" };

        SetupFileWatchers();
        MonitorDocker();
    }

    private void SetupFileWatchers()
    {
        foreach (var path in _pathsToWatch)
        {
            if (!Directory.Exists(path)) continue;

            var watcher = new FileSystemWatcher(path)
            {
                IncludeSubdirectories = true,
                EnableRaisingEvents = true
            };

            watcher.Created += async (s, e) => await HandleEvent(e.FullPath, "Created");
            watcher.Changed += async (s, e) => await HandleEvent(e.FullPath, "Modified");
            watcher.Deleted += async (s, e) => await HandleEvent(e.FullPath, "Deleted");
            watcher.Renamed += async (s, e) =>
            {
                var user = await GetFileOwnerAsync(e.FullPath);
                _queue.Enqueue(new LogEntry
                {
                    Action = "Renamed",
                    Target = e.FullPath,
                    Details = $"Renamed from {e.OldFullPath}"
                });
            };

            _watchers.Add(watcher);
        }
    }

    private async Task HandleEvent(string path, string action)
    {
        string user = await GetFileOwnerAsync(path);
        _queue.Enqueue(new LogEntry
        {
            Action = action,
            Target = path,
            Details = Directory.Exists(path) ? "Folder " + action.ToLower() : "File " + action.ToLower()
        });
    }

    private async Task<string> GetFileOwnerAsync(string path)
    {
        try
        {
            if (!File.Exists(path) && !Directory.Exists(path)) return "unknown";
            return (await RunCommandAsync($"stat -c '%U' \"{path}\"")).Trim();
        }
        catch { return "unknown"; }
    }

    private void MonitorDocker()
    {
        Task.Run(async () =>
        {
            var knownContainers = new HashSet<string>();
            while (true)
            {
                string user = (await RunCommandAsync("whoami")).Trim();
                var containers = await RunCommandAsync("docker ps -a --format \"{{.Names}}\"");
                var currentContainers = containers.Split('\n', StringSplitOptions.RemoveEmptyEntries).ToHashSet();

                foreach (var c in currentContainers.Except(knownContainers))
                    _queue.Enqueue(new LogEntry { Action = "DockerCreated", Target = c, Details = "Docker container created" });

                foreach (var c in knownContainers.Except(currentContainers))
                    _queue.Enqueue(new LogEntry { Action = "DockerDeleted", Target = c, Details = "Docker container deleted" });

                knownContainers = currentContainers;

                await Task.Delay(30000);
            }
        });
    }

    private async Task<string> RunCommandAsync(string command)
    {
        var escapedArgs = command.Replace("\"", "\\\"");
        var process = new Process()
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "/bin/bash",
                Arguments = $"-c \"{escapedArgs}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };
        process.Start();
        string output = await process.StandardOutput.ReadToEndAsync();
        process.WaitForExit();
        return output;
    }
}
   

