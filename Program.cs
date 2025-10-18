using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OSManager.API.Models;
using OSManager.Core.Core.Helpers;
using OSManager.Hubs.FolderHubs;
using OSManager.Hubs.PerformanceHub;
using OSManager.Middleware;
using OSManager.Provider.JWTProvider;
using OSManager.Service.Auth;
using OSManager.Service.DirectoryExplorerService;
using OSManager.Service.DirectoryService;
using OSManager.Service.FolderService;
using OSManager.Service.SystemMonitorService;

var builder = WebApplication.CreateBuilder(args);
DotNetEnv.Env.Load();
var env = Environment.GetEnvironmentVariable("VITE_API_URL");
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.Configure<MountSettings>(
    builder.Configuration.GetSection("MountSettings"));

builder.Services.AddScoped<IDirectoryScannerService, DirectoryScannerService>();
builder.Services.AddScoped<IDirectoryExplorerService, DirectoryExplorerService>();
builder.Services.AddSingleton<IPerformanceReaderService, PerformanceReaderService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<Core_Helpers_EnvironmentHelper>();
builder.Services.AddSingleton<JwtSecretProvider>();
builder.Services.AddHostedService<MonitoringBackgroundService>();
builder.Services.AddScoped<IFolderService, FolderService>();

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

app.UseMiddleware<ApiKeyMiddleware>();
var envHelper = app.Services.GetRequiredService<Core_Helpers_EnvironmentHelper>();
envHelper.EnsureMountedHostRootExists(app.Logger);

app.UseHttpsRedirection();
app.UseStaticFiles(); 
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
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
app.Run();

