using AuthService.Data;
using AuthService.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

// Deljena konfiguracija hosta - koristi je i plain Kestrel grana u Program.cs
// i AuthStatelessService kada je servis pokrenut pod pravim Service Fabric klasterom.
internal static class Startup
{
    public static void ConfigureServices(WebApplicationBuilder builder)
    {
        var config = builder.Configuration;

        builder.Services.AddDbContext<AuthDbContext>(options =>
            options.UseSqlServer(config.GetConnectionString("DefaultConnection")));

        builder.Services.AddScoped<JwtService>();

        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = config["Jwt:Issuer"],
                    ValidAudience = config["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(config["Jwt:Key"]!))
                };
            });

        builder.Services.AddAuthorization();
        builder.Services.AddControllers();
        builder.Services.AddCors(options =>
            options.AddDefaultPolicy(p =>
                p.WithOrigins(config["AllowedOrigin"]!)
                 .AllowAnyHeader().AllowAnyMethod()));
    }

    public static void ConfigureApp(WebApplication app)
    {
        app.UseCors();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
    }
}
