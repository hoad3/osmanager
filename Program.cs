using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Microsoft.OpenApi.Models;
using OSManager.API.Models;
using OSManager.Core.Core.Helpers;
using OSManager.Hubs.DockerHubs;
using OSManager.Hubs.Filehubs;
using OSManager.Hubs.FolderHubs;
using OSManager.Hubs.PerformanceHub;
// using OSManager.Hubs.UploadHubs;
using OSManager.Middleware;
using OSManager.Models;
using OSManager.Provider.JWTProvider;
using OSManager.Service.Auth;
using OSManager.Service.DirectoryExplorerService;
using OSManager.Service.DirectoryService;
using OSManager.Service.DockerService;
using OSManager.Service.FileService;
using OSManager.Service.FirewallRule;
using OSManager.Service.FolderService;
using OSManager.Service.HistoryOS;
using OSManager.Service.ReportEmailService;
using OSManager.Service.SystemMonitorService;
using OSManager.Service.TimeService;
using OSManager.Service.UploadService;
using OSManager.Service.UserService;

var builder = WebApplication.CreateBuilder(args);
DotNetEnv.Env.Load();
var env = Environment.GetEnvironmentVariable("VITE_API_URL");
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR(options =>
{
    options.MaximumReceiveMessageSize = 1000 * 1024 * 1024; // 1000 MB
});
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.Configure<MountSettings>(
    builder.Configuration.GetSection("MountSettings"));
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IDirectoryScannerService, DirectoryScannerService>();
builder.Services.AddScoped<IDirectoryExplorerService, DirectoryExplorerService>();
builder.Services.AddSingleton<IPerformanceReaderService, PerformanceReaderService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<Core_Helpers_EnvironmentHelper>();
builder.Services.AddSingleton<JwtSecretProvider>();
builder.Services.AddHostedService<MonitoringBackgroundService>();
builder.Services.AddScoped<IFolderService, FolderService>();
builder.Services.AddScoped<IFirewallService, FirewallService>();
builder.Services.AddScoped<IDockerService, DockerService>();

builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IUploadService, UploadService>();
builder.Services.AddSingleton<StorageService>();
builder.Services.AddSingleton<IHistoryQueue, HistoryQueueService>();
builder.Services.AddHostedService<HistoryOSService>();
builder.Services.AddSingleton<VPSMonitorService>();
builder.Services.AddScoped<IGetHistoryOS, GetHistoryOS>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<UserContext>();
builder.Services.AddSingleton<IMailService, MailService>();
builder.Services.AddHostedService<DailyHistoryMailService>();
builder.Services.AddSingleton<IHistoryReportService, HistoryReportService>();
builder.Services.AddSingleton<ITimeService, TimeService>();
// builder.Services.AddSingleton<MiddlewareStorage>(sp =>
// {
//     var key = Environment.GetEnvironmentVariable("OSMANAGER_SECRET_KEY");
//
//     if (string.IsNullOrWhiteSpace(key))
//         throw new Exception("Environment variable OSMANAGER_SECRET_KEY is missing!");
//
//     if (key.Length != 32)
//         throw new Exception("OSMANAGER_SECRET_KEY must be exactly 32 characters!");
//
//     return new MiddlewareStorage(key);
// });
builder.Services.AddSingleton(sp =>
{
    var secret = Environment.GetEnvironmentVariable("OSMANAGER_SECRET_KEY");

    if (string.IsNullOrWhiteSpace(secret))
        throw new Exception("OSMANAGER_SECRET_KEY missing");

    return new MiddlewareStorage(secret);
});

builder.Services.AddHttpContextAccessor();

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient();
builder.Services.AddCors();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder
            .WithOrigins("http://localhost:5173", env) // thêm domain frontend production
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .WithExposedHeaders("X-API-KEY");
    });
});

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(); 

builder.Services.AddAuthorization();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Your API", Version = "v1" });
    c.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
    {
        Description = "API Key needed to access the endpoints. X-API-KEY: {token}",
        In = ParameterLocation.Header,
        Name = "X-API-KEY",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "ApiKeyScheme"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "ApiKey" }
            },
            Array.Empty<string>()
        },
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});


var app = builder.Build();

var jwtSecret = app.Services.GetRequiredService<JwtSecretProvider>().SecretKey;
var jwtOptions = app.Services.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>();
var jwtBearer = jwtOptions.Get(JwtBearerDefaults.AuthenticationScheme);
var storage = app.Services.GetRequiredService<StorageService>();
storage.Initialize();
var monitor = app.Services.GetRequiredService<VPSMonitorService>();
jwtBearer.TokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuer = true,
    ValidateAudience = true,
    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,
    ValidIssuer = "OSManager",
    ValidAudience = "OSManagerUsers",
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
};


var envHelper = app.Services.GetRequiredService<Core_Helpers_EnvironmentHelper>();
envHelper.EnsureMountedHostRootExists(app.Logger);

app.UseHttpsRedirection(); //Comment khi test trên ubuntu server virtual box
app.UseStaticFiles(); 
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<ApiKeyMiddleware>();
app.UseMiddleware<UserContextMiddleware>();
app.UseCors("AllowFrontend");

app.UseSwagger();
app.UseSwaggerUI();
app.UseDefaultFiles(); 
app.MapControllers(); 
app.MapFallbackToFile("index.html"); 
// app.UseCors(options =>
// {
//     options.AllowAnyHeader()
//         .AllowAnyOrigin();
//     options.AllowAnyMethod();
//     options.WithOrigins();
// });

app.MapHub<PerformanceHub>("/performancehub").RequireCors("AllowFrontend");
app.MapHub<FolderHubs>("/folderhubs").RequireCors("AllowFrontend");
app.MapHub<DockerHubs>("/dockerHub");
app.MapHub<FileHubs>("/filehubs");
// app.MapHub<UploadHubs>("/uploadhubs");
app.Run();

