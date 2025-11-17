using OSManager.Core.Core.Helpers;

namespace OSManager.Middleware;

public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;

    public ApiKeyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLower();
        var acceptHeader = context.Request.Headers["Accept"].ToString();
        if (string.Equals(context.Request.Method, "GET", StringComparison.OrdinalIgnoreCase) &&
            acceptHeader.Contains("text/html", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }
        // Kiểm tra cả negotiate endpoint của SignalR
        if (path != null && (
                path == "/" ||
                path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) ||
                path.Equals("/favicon.ico", StringComparison.OrdinalIgnoreCase) ||
                path.Equals("/api/auth/login/password", StringComparison.OrdinalIgnoreCase) ||
                path.Equals("/api/auth/login/sshkey", StringComparison.OrdinalIgnoreCase) ||
                path.StartsWith("/assets", StringComparison.OrdinalIgnoreCase) ||
                path.EndsWith(".js", StringComparison.OrdinalIgnoreCase) ||
                path.EndsWith(".css", StringComparison.OrdinalIgnoreCase) ||
                path.EndsWith(".html", StringComparison.OrdinalIgnoreCase) ||
                path.EndsWith(".ico", StringComparison.OrdinalIgnoreCase) ||
                path.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ||
                path.StartsWith("/performancehub", StringComparison.OrdinalIgnoreCase) ||
                path.StartsWith("/folderhubs", StringComparison.OrdinalIgnoreCase) ||
                path.StartsWith("/dockerHub", StringComparison.OrdinalIgnoreCase) ||
                path.StartsWith("/filehubs", StringComparison.OrdinalIgnoreCase) ||
                path.StartsWith("/uploadhubs", StringComparison.OrdinalIgnoreCase) ||
                path.Contains("/negotiate") 
            ))
        {
            await _next(context);
            return;
        }
        if (!context.Request.Headers.TryGetValue("X-API-KEY", out var key) ||
            !Core_Helpers_ApiKeyStore.IsValid(key))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("Invalid or missing API key.");
            return;
        }

        await _next(context);
    }
}