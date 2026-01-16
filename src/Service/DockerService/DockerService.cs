    using System.Text;
    using System.Text.Json;
    using Docker.DotNet;
    using Docker.DotNet.Models;
    using OSManager.Models;
    using OSManager.Service.HistoryOS;
    using OSManager.Service.TimeService;
    using Renci.SshNet;
    namespace OSManager.Service.DockerService;

    public class DockerService: IDockerService
    {
        private readonly DockerClient _client;
        private readonly string _rootPath;
        private readonly string _dockerComposePath;
        private readonly string dockerPath;
        
        private readonly string _sshHost;
        private readonly string _sshUser;
        private readonly int _sshPort;
        private readonly StorageService _storage;

        private readonly IHistoryQueue _queue;
        private readonly ITimeService _timeService;
        public DockerService(StorageService storage, IHistoryQueue queue, ITimeService timeService)
        {
            _timeService = timeService;
            _queue = queue;
            _client = new DockerClientConfiguration(
                new Uri("unix:///var/run/docker.sock")
            ).CreateClient();
            _rootPath = Environment.GetEnvironmentVariable("MOUNT_ROOT") ?? "/hostroot";
            _dockerComposePath = Environment.GetEnvironmentVariable("DOCKER_COMPOSE_PATH");
            dockerPath = Environment.GetEnvironmentVariable("DOCKER_PATH");
            
            _sshHost = Environment.GetEnvironmentVariable("HOST_SSH_IP") ?? "127.0.0.1";
            _sshUser = Environment.GetEnvironmentVariable("SSH_USER") ?? "root";
            _sshPort = int.TryParse(Environment.GetEnvironmentVariable("HOST_PORT"), out var p) ? p : 22;
            _storage = storage;
        }          

        public async Task<IEnumerable<object>> GetAllImagesAsync()
        {
            var images = await _client.Images.ListImagesAsync(new ImagesListParameters { All = true });
            var containers = await _client.Containers.ListContainersAsync(new ContainersListParameters { All = true });

            var result = new List<object>();

            foreach (var img in images)
            {
                var inspect = await _client.Images.InspectImageAsync(img.ID);
                var usedBy = containers.Count(c => c.ImageID == img.ID);

                result.Add(new
                {
                    Id = img.ID,
                    RepoTags = img.RepoTags != null ? string.Join(", ", img.RepoTags) : "<none>",
                    Size = FormatBytes(inspect.Size), 
                    Created = img.Created.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss"),
                    Containers = usedBy
                });
            }

            return result;
        }

        public async Task<IEnumerable<object>> GetAllContainersAsync()
        {
            var containers = await _client.Containers.ListContainersAsync(
                new ContainersListParameters { All = true });

            return containers.Select(container => new
            {
                Id = container.ID.Substring(0, 12),
                Name = container.Names.FirstOrDefault()?.TrimStart('/'),
                Image = container.Image,
                State = container.State,
                Status = container.Status,
                Created = container.Created.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss"),
                Ports = container.Ports
                    .GroupBy(p => new { p.PrivatePort, p.PublicPort, p.Type })
                    .Select(g => new
                    {
                        PrivatePort = g.Key.PrivatePort,
                        PublicPort = g.Key.PublicPort,
                        Type = g.Key.Type
                    })
                    .ToList()
            });
        }
        
        private SshClient CreateSshClient(string privateKeyContent, string? passphrase)
        {
            PrivateKeyFile keyFile;
            using (var ms = new MemoryStream(Encoding.UTF8.GetBytes(privateKeyContent)))
            {
                keyFile = string.IsNullOrEmpty(passphrase)
                    ? new PrivateKeyFile(ms)
                    : new PrivateKeyFile(ms, passphrase);
            }

            var connInfo = new Renci.SshNet.ConnectionInfo(
                _sshHost, _sshPort, _sshUser,
                new PrivateKeyAuthenticationMethod(_sshUser, new[] { keyFile })
            );

            return new SshClient(connInfo);
        }
     private string RunCommandOverSsh(SshClient client, string command)
        {
            using var cmd = client.CreateCommand(command);
            var result = cmd.Execute();
            if (!string.IsNullOrWhiteSpace(cmd.Error))
                return cmd.Error;
            return result;
        }
        public async Task<string> LoadImageFromTarAsync(string directoryPath, string sshPrivateKey, string? passphrase = null)
        {
            return await Task.Run(() =>
            {
                using var client = CreateSshClient(sshPrivateKey, passphrase);
                client.Connect();
                var commandList = $"cd \"{directoryPath}\" && ls *.tar";
                var tarFileName = RunCommandOverSsh(client, commandList).Split('\n', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
                if (tarFileName == null)
                    throw new FileNotFoundException("Không tìm thấy file .tar trong VPS.", directoryPath);

                string command = $"cd \"{directoryPath}\" && {dockerPath} load -i \"{tarFileName}\"";
                string output = RunCommandOverSsh(client, command);
                _queue.Enqueue(new LogEntry
                {
                    Action = "Create Images",
                    Target = directoryPath,
                    Details = "Images created",
                    Timestamp = _timeService.GetVietnamNowOffset()
                });
                client.Disconnect();
                return output;
            });
        }

        public async Task<string> RemoveImageByNameAsync(string repository, string tag, string sshPrivateKey, string? passphrase = null)
        {
            return await Task.Run(() =>
            {
                using var client = CreateSshClient(sshPrivateKey, passphrase);
                client.Connect();

                string command = $"{dockerPath} rmi -f {repository}:{tag}";
                string output = RunCommandOverSsh(client, command);

                _queue.Enqueue(new LogEntry
                {
                    Action = "Delete Images",
                    Target = repository,
                    Details = $"Images {repository}  Delete",
                    Timestamp = _timeService.GetVietnamNowOffset()
                });
                
                client.Disconnect();
                return output;
            });
        }

        public async Task<string> StartContainersAsync(string directoryPath, string sshPrivateKey, string? passphrase = null)
        {
           
            return await Task.Run(() =>
            {
                using var client = CreateSshClient(sshPrivateKey, passphrase);
                client.Connect();
                string command = $"cd \"{directoryPath}\" && {_dockerComposePath} up -d";
                string output = RunCommandOverSsh(client, command);
                
                _queue.Enqueue(new LogEntry
                {
                    Action = "Create Container",
                    Target = directoryPath,
                    Details = "Container created",
                    Timestamp = _timeService.GetVietnamNowOffset()
                });
                
                client.Disconnect();
                return output;
            });
        }

        public async Task<string> StopContainersAsync(string directoryPath, string sshPrivateKey, string? passphrase = null)
        {
            return await Task.Run(() =>
            {
                
                if (directoryPath == null)
                    throw new Exception("Không tìm thấy dữ liệu container hoặc directoryPath");
                using var client = CreateSshClient(sshPrivateKey, passphrase);
                client.Connect();

                string command = $"cd \"{directoryPath}\" && {_dockerComposePath} down";
                string output = RunCommandOverSsh(client, command);

                _queue.Enqueue(new LogEntry
                {
                    Action = "Delete Container",
                    Target = directoryPath,
                    Details = "Delete Container",
                    Timestamp = _timeService.GetVietnamNowOffset()
                });
                
                client.Disconnect();
                return output;
            });
        }
        private string FormatBytes(long bytes)
        {
            double kb = bytes / 1024.0;
            double mb = kb / 1024.0;
            double gb = mb / 1024.0;

            if (gb >= 1) return $"{gb:F2} GB";
            if (mb >= 1) return $"{mb:F2} MB";
            return $"{kb:F2} KB";
        }
        
        public async Task<string> PullImageAsync(string repository, string sshPrivateKey, string? passphrase = null)
        {
            return await Task.Run(() =>
            {
                using var client = CreateSshClient(sshPrivateKey, passphrase);
                client.Connect();
                string command = $"{dockerPath} pull {repository}";
                string output = RunCommandOverSsh(client, command);
                _queue.Enqueue(new LogEntry
                {
                    Action = "Pull Image",
                    Target = repository,
                    Details = $"Image {repository} pulled",
                    Timestamp = _timeService.GetVietnamNowOffset()
                });
                client.Disconnect();
                return output;
            });
        }

    }