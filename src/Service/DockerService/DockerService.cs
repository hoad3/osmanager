using Docker.DotNet;
using Docker.DotNet.Models;

namespace OSManager.Service.DockerService;

public class DockerService: IDockerService
{
    private readonly DockerClient _client;

    public DockerService()
    {
        _client = new DockerClientConfiguration(
            new Uri("unix:///var/run/docker.sock")
        ).CreateClient();
    }
    //           

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
    //            

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
        public async Task<bool> StopContainerAsync(string containerId)
        {
            return await _client.Containers.StopContainerAsync(containerId, new ContainerStopParameters());
        }
        public async Task StartContainerAsync(string containerId)
        {
            await _client.Containers.StartContainerAsync(containerId, null);
        }
        public async Task RemoveContainerAsync(string containerId)
        {
            await _client.Containers.RemoveContainerAsync(containerId, new ContainerRemoveParameters { Force = true });
        }
        public async Task RemoveImageAsync(string imageId)
        {
            await _client.Images.DeleteImageAsync(imageId, new ImageDeleteParameters { Force = true });
        }
        private string FormatBytes(long bytes)
        {
            double kb = bytes / 1024.0;
            double mb = kb / 1024.0;
            double gb = mb / 1024.0;

            if (gb >= 1)
                return $"{gb:F2} GB";
            else if (mb >= 1)
                return $"{mb:F2} MB";
            else
                return $"{kb:F2} KB";
        }
    }

