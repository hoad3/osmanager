using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Sockets;
using System.Text.RegularExpressions;
using Renci.SshNet;
using ConnectionInfo = Microsoft.AspNetCore.Http.ConnectionInfo;

namespace OSManager.Service.FirewallRule
{ 
    public class FirewallRequestDto
    {
        public string SshPrivateKey { get; set; }
    }
    public class FirewallRule
    {
        public string Name { get; set; }
        public string Action { get; set; } = "ALLOW";
        public string Direction { get; set; } = "IN";
        public string Protocol { get; set; } 
        public string Port { get; set; } 
        public bool IsActive { get; set; } 
        public bool IsUsed { get; set; } = true;
        public string SshHost { get; set; } 
        public int SshPort { get; set; } = 22;
        public string SshUser { get; set; } 
        public string SshPrivateKey { get; set; }

        public string SshPrivateKeyPassphrase { get; set; }
        
        public string RemoteCommand { get; set; } = null;
    }

    public class FirewallService : IFirewallService
    {
        private const string DefaultRemoteCommand = "ss -tuln";

    public List<FirewallRule> GetFirewallRulesViaSsh(FirewallRule request, int commandTimeoutSec = 10)
    {
        if (request == null) throw new ArgumentNullException(nameof(request));
        if (string.IsNullOrWhiteSpace(request.SshHost))
        {
            request.SshHost = Environment.GetEnvironmentVariable("HOST_SSH_IP") ?? "127.0.0.1";
        }

        if (string.IsNullOrWhiteSpace(request.SshUser)) throw new ArgumentException("SshUser required");
        if (string.IsNullOrWhiteSpace(request.SshPrivateKey)) throw new ArgumentException("SshPrivateKey required");

        var remoteCmd = string.IsNullOrWhiteSpace(request.RemoteCommand)
            ? DefaultRemoteCommand
            : request.RemoteCommand;

        string output;
        try
        {
            output = RunRemoteCommandUsingPrivateKey(
                host: request.SshHost,
                port: request.SshPort <= 0 ? 22 : request.SshPort,
                username: request.SshUser,
                privateKeyContent: request.SshPrivateKey,
                passphrase: request.SshPrivateKeyPassphrase,
                command: remoteCmd,
                timeoutSeconds: commandTimeoutSec
            );
        }
        catch (Exception ex)
        {
            Console.WriteLine("[FirewallService] SSH exec error: " + ex.Message);
            return new List<FirewallRule>();
        }

        if (string.IsNullOrWhiteSpace(output))
            return new List<FirewallRule>();

        var parsed = ParseListeningPorts(output);
        foreach (var r in parsed)
        {
            r.SshHost = request.SshHost;
            r.SshPort = request.SshPort;
            r.SshUser = request.SshUser;
            r.IsActive = true;
        }

        return parsed.OrderBy(r =>
        {
            if (int.TryParse(r.Port, out var p)) return p;
            return int.MaxValue;
        }).ToList();
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
            var connectionInfo = new Renci.SshNet.ConnectionInfo(host, port,username,keyAuth)
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
            // Wait but bounded
            var waitUntil = DateTime.UtcNow.AddSeconds(timeoutSeconds);
            while (!asyncResult.IsCompleted && DateTime.UtcNow < waitUntil)
            {
                System.Threading.Thread.Sleep(50);
            }

            if (!asyncResult.IsCompleted)
            {
                try
                {
                    cmd.CancelAsync();
                }
                catch
                {
                }

                client.Disconnect();
                throw new TimeoutException("Remote command timed out");
            }

            var stdout = cmd.EndExecute(asyncResult);
            var stderr = cmd.Error;
            client.Disconnect();

            if (!string.IsNullOrWhiteSpace(stderr))
            {
                Console.WriteLine("[FirewallService] remote stderr: " + stderr.Trim());
            }

            return stdout ?? string.Empty;
        }
        private List<FirewallRule> ParseListeningPorts(string ssOutput)
        {
            var list = new List<FirewallRule>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var lines = ssOutput
                .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(l => l.Trim())
                .Where(l => !string.IsNullOrWhiteSpace(l))
                .ToList();

            var protoRegex = new Regex(@"^(tcp6|udp6|tcp|udp)\b", RegexOptions.IgnoreCase);
            var hostPortRegex = new Regex(@"(?<addr>(?:\[[^\]]+\]|[^:\s]+)):(?<port>\d{1,5})");

            foreach (var line in lines)
            {
                if (line.IndexOf("Netid", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    line.IndexOf("Proto", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    line.IndexOf("Active Internet", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    line.IndexOf("Local Address", StringComparison.OrdinalIgnoreCase) >= 0)
                    continue;

                string proto = "TCP";
                var pm = protoRegex.Match(line);
                if (pm.Success)
                {
                    var p = pm.Groups[1].Value.ToLowerInvariant();
                    proto = p.StartsWith("udp") ? "UDP" : "TCP";
                }
                else
                {
                    proto = line.IndexOf("udp", StringComparison.OrdinalIgnoreCase) >= 0 ? "UDP" : "TCP";
                }

                var hp = hostPortRegex.Match(line);
                if (!hp.Success) continue;
                var portStr = hp.Groups["port"].Value;
                if (!int.TryParse(portStr, out var portNum) || portNum <= 0 || portNum > 65535) continue;

                var key = $"{proto}:{portStr}";
                if (seen.Contains(key)) continue;
                seen.Add(key);

                var rule = new FirewallRule
                {
                    Name = $"Port {portStr}",
                    Protocol = proto,
                    Port = portStr,
                    IsUsed = true,
                    Action = "ALLOW",
                    Direction = "IN",
                    IsActive = true
                };

                list.Add(rule);
            }

            return list;
        }
    }
}