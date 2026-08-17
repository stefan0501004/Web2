using Microsoft.ServiceFabric.Services.Runtime;

internal static class Program
{
    private static async Task Main(string[] args)
    {
        if (Environment.GetEnvironmentVariable("Fabric_ApplicationName") is not null)
        {
            // Servis je pokrenut kroz Service Fabric klaster - registruje se kao pravi SF stateless servis.
            await ServiceRuntime.RegisterServiceAsync("AuthServiceType",
                context => new AuthStatelessService(context));

            Thread.Sleep(Timeout.Infinite);
        }
        else
        {
            // Brzi razvojni režim (dotnet run) - običan Kestrel host, bez SF klastera.
            var builder = WebApplication.CreateBuilder(args);
            Startup.ConfigureServices(builder);
            var app = builder.Build();
            Startup.ConfigureApp(app);
            app.Run();
        }
    }
}
