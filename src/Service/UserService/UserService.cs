using System.Text.Json;
using OSManager.Middleware;
using OSManager.Models;
using OSManager.Service.HistoryOS;
using OSManager.Service.TimeService;
using Renci.SshNet;

namespace OSManager.Service.UserService;

public class UserService
{
    private readonly StorageService _storageService;
    private const int DefaultTimeoutSec = 15;
    private readonly IHistoryQueue _queue;
    private readonly MiddlewareStorage _crypto;
    private readonly ITimeService _timeService;
    public UserService(StorageService storageService, IHistoryQueue queue, MiddlewareStorage crypto, ITimeService timeService)
    {
        _timeService = timeService;
        _queue = queue;
        _storageService = storageService;
        _crypto = crypto;
    }

        public void CreateUser(VPSUserCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username)) throw new ArgumentException("Username required");
            if (string.IsNullOrWhiteSpace(dto.Password)) throw new ArgumentException("Password required");
            if (string.IsNullOrWhiteSpace(dto.SshPrivateKey)) throw new ArgumentException("SSH private key required");
            string cmd = $"sudo useradd -m -s /bin/bash {dto.Username} && echo \"{dto.Username}:{dto.Password}\" | sudo chpasswd";

            if (dto.IsRoot)
            {
                cmd += $" && sudo usermod -aG sudo {dto.Username}";
            }

            if (dto.CanUseDocker)
            {
                cmd += $" && sudo usermod -aG docker {dto.Username}";
            }

            if (dto.AllowedDirectories.Length > 0)
            {
                foreach (var dir in dto.AllowedDirectories)
                {
                    cmd += $" && sudo mkdir -p {dir} && sudo chown {dto.Username}:{dto.Username} {dir} && sudo chmod 700 {dir}";
                }
            }

            var output = RunRemoteCommandUsingPrivateKey(
                host: dto.SshHost,
                port: dto.SshPort,
                username: dto.SshUser,
                privateKeyContent: dto.SshPrivateKey,
                passphrase: dto.SshPrivateKeyPassphrase,
                command: cmd,
                timeoutSeconds: DefaultTimeoutSec
            );
            var userInfo = new
            {
                Username = dto.Username,
                Role = dto.IsRoot ? "root" : "user",
                CanUseDocker = dto.CanUseDocker,
                CanUseOSManagement = dto.CanUseOSManagement,
                Email = dto.Email
            };
            _storageService.LogUserInformation(dto.Username, userInfo);
            _queue.Enqueue(new LogEntry
            {
                Action = "Create User",
                Target = dto.Username,
                Details = "User created",
                Timestamp = _timeService.GetVietnamNowOffset()
            });
            if (!string.IsNullOrWhiteSpace(output))
            {
                Console.WriteLine("[VPSUserService] Output: " + output.Trim());
            }
        }

        private string RunRemoteCommandUsingPrivateKey(string host, int port, string username, string privateKeyContent,
            string passphrase, string command, int timeoutSeconds)
        {
            using var keyStream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(privateKeyContent));
            PrivateKeyFile keyFile;
            if (string.IsNullOrEmpty(passphrase))
                keyFile = new PrivateKeyFile(keyStream);
            else
            {
                keyStream.Position = 0;
                keyFile = new PrivateKeyFile(keyStream, passphrase);
            }

            var keyAuth = new AuthenticationMethod[] { new PrivateKeyAuthenticationMethod(username, keyFile) };
            var connectionInfo = new Renci.SshNet.ConnectionInfo(host, port, username, keyAuth)
            {
                Timeout = TimeSpan.FromSeconds(Math.Max(5, timeoutSeconds))
            };

            using var client = new SshClient(connectionInfo);
            client.ConnectionInfo.RetryAttempts = 1;
            client.Connect();

            if (!client.IsConnected)
                throw new InvalidOperationException("SSH connect failed");

            using var cmd = client.CreateCommand(command);
            cmd.CommandTimeout = TimeSpan.FromSeconds(Math.Max(5, timeoutSeconds));

            var asyncResult = cmd.BeginExecute();
            var waitUntil = DateTime.UtcNow.AddSeconds(timeoutSeconds);
            while (!asyncResult.IsCompleted && DateTime.UtcNow < waitUntil)
            {
                System.Threading.Thread.Sleep(50);
            }

            if (!asyncResult.IsCompleted)
            {
                try { cmd.CancelAsync(); } catch { }
                client.Disconnect();
                throw new TimeoutException("Remote command timed out");
            }

            var stdout = cmd.EndExecute(asyncResult);
            var stderr = cmd.Error;
            client.Disconnect();

            if (!string.IsNullOrWhiteSpace(stderr))
            {
                Console.WriteLine("[VPSUserService] stderr: " + stderr.Trim());
            }

            return stdout ?? string.Empty;
        }
        
        public void UpdateUserPermissions(VPSUserUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username)) 
                throw new ArgumentException("Username required");
            if (string.IsNullOrWhiteSpace(dto.SshPrivateKey)) 
                throw new ArgumentException("SSH private key required");
            var cmdBuilder = new List<string>();
            if (dto.IsRoot.HasValue)
            {
                if (dto.IsRoot.Value)
                    cmdBuilder.Add($"sudo usermod -aG sudo {dto.Username}");
                else
                    cmdBuilder.Add($"sudo deluser {dto.Username} sudo || true");
            }
            if (dto.CanUseDocker.HasValue)
            {
                if (dto.CanUseDocker.Value)
                    cmdBuilder.Add($"sudo usermod -aG docker {dto.Username}");
                else
                    cmdBuilder.Add($"sudo deluser {dto.Username} docker || true");
            }
            if (dto.AllowedDirectories != null)
            {
                foreach (var dir in dto.AllowedDirectories)
                {
                    cmdBuilder.Add($"sudo mkdir -p {dir} && sudo chown {dto.Username}:{dto.Username} {dir} && sudo chmod 700 {dir}");
                }
            }
            var cmd = string.Join(" && ", cmdBuilder);

            var output = RunRemoteCommandUsingPrivateKey(
                host: dto.SshHost,
                port: dto.SshPort,
                username: dto.SshUser,
                privateKeyContent: dto.SshPrivateKey,
                passphrase: dto.SshPrivateKeyPassphrase,
                command: cmd,
                timeoutSeconds: DefaultTimeoutSec
            );
            var updatedInfo = new
            {
                Username = dto.Username,
                Role = dto.IsRoot.HasValue && dto.IsRoot.Value ? "root" : "user",
                CanUseDocker = dto.CanUseDocker ?? false,
                CanUseOSManagement = dto.CanUseOSManager ?? false,
                Email = dto.Email
            };
            _storageService.LogUserInformation(dto.Username, updatedInfo);
            _queue.Enqueue(new LogEntry
            {
                Action = "Update User",
                Target = dto.Username,
                Details = "User Updated",
                Timestamp = _timeService.GetVietnamNowOffset()
            });
            if (!string.IsNullOrWhiteSpace(output))
            {
                Console.WriteLine("[VPSUserService] UpdateUserPermissions Output: " + output.Trim());
            }
        }
        
        public void DeleteUser(VPSUserDeleteDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username)) 
                throw new ArgumentException("Username required");
            if (string.IsNullOrWhiteSpace(dto.SshPrivateKey)) 
                throw new ArgumentException("SSH private key required");
            string cmd = $"sudo deluser --remove-home {dto.Username} || true";

            if (dto.RemoveFromDockerGroup)
                cmd += $" && sudo deluser {dto.Username} docker || true";

            if (dto.RemoveFromSudoGroup)
                cmd += $" && sudo deluser {dto.Username} sudo || true";
            var output = RunRemoteCommandUsingPrivateKey(
                host: dto.SshHost,
                port: dto.SshPort,
                username: dto.SshUser,
                privateKeyContent: dto.SshPrivateKey,
                passphrase: dto.SshPrivateKeyPassphrase,
                command: cmd,
                timeoutSeconds: DefaultTimeoutSec
            );
            _storageService.DeleteUserInformation(dto.Username);
            _queue.Enqueue(new LogEntry
            {
                Action = "Delete User",
                Target = dto.Username,
                Details = "User Delete",
                Timestamp = _timeService.GetVietnamNowOffset()
            });
            if (!string.IsNullOrWhiteSpace(output))
                Console.WriteLine("[VPSUserService] DeleteUser Output: " + output.Trim());
        }
        
}