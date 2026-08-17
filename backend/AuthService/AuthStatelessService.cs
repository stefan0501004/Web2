using Microsoft.ServiceFabric.Services.Communication.AspNetCore;
using Microsoft.ServiceFabric.Services.Communication.Runtime;
using Microsoft.ServiceFabric.Services.Runtime;
using System.Fabric;

internal sealed class AuthStatelessService : StatelessService
{
    public AuthStatelessService(StatelessServiceContext context)
        : base(context) { }

    protected override IEnumerable<ServiceInstanceListener> CreateServiceInstanceListeners()
    {
        return new ServiceInstanceListener[]
        {
            new ServiceInstanceListener(context =>
                new KestrelCommunicationListener(context, "ServiceEndpoint", (url, listener) =>
                {
                    var builder = WebApplication.CreateBuilder();
                    Startup.ConfigureServices(builder);
                    builder.WebHost.UseKestrel();
                    builder.WebHost.UseUrls(url);
                    builder.WebHost.UseServiceFabricIntegration(listener, ServiceFabricIntegrationOptions.None);
                    var app = builder.Build();
                    Startup.ConfigureApp(app);
                    return app;
                }))
        };
    }
}
