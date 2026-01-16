using OSManager.Models;

namespace OSManager.Middleware;

public class UserContextMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<UserContextMiddleware> _logger;

    public UserContextMiddleware(RequestDelegate next, ILogger<UserContextMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, UserContext userContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var username = context.User.Identity.Name ?? "unknown";
            userContext.Username = username;

            var rootPath = Environment.GetEnvironmentVariable("USER_ROOT_PATH");
            if (string.Equals(username, "root", StringComparison.OrdinalIgnoreCase))
            {
                userContext.HomePath = "/";
            }
            else
            {
                userContext.HomePath = Path.Combine(rootPath, username);
            }

            _logger.LogInformation("UserContext set: {user} -> {path}", username, userContext.HomePath);
        }

        await _next(context);
    }
}