using System.Security.Claims;

namespace OSManager.Service.Auth;

public class CurrentUserService: ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string Username
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                return "no-httpcontext";

            if (!user.Identity.IsAuthenticated)
                return "not-authenticated";

            var name = user.Identity.Name ?? "no-name";
            var role = user.FindFirst(ClaimTypes.Role)?.Value ?? "no-role";
            Console.WriteLine($"[CurrentUserService] Name={name}, Role={role}");
            return name;
        }
    }
}