using Microsoft.ServiceFabric.Data;
using Microsoft.ServiceFabric.Data.Collections;
using Microsoft.ServiceFabric.Services.Communication.AspNetCore;
using Microsoft.ServiceFabric.Services.Communication.Runtime;
using Microsoft.ServiceFabric.Services.Runtime;
using System.Fabric;

internal sealed class TravelPlanStatefulService : StatefulService
{
    public TravelPlanStatefulService(StatefulServiceContext context)
        : base(context) { }

    protected override IEnumerable<ServiceReplicaListener> CreateServiceReplicaListeners()
    {
        return new ServiceReplicaListener[]
        {
            new ServiceReplicaListener(context =>
                new KestrelCommunicationListener(context, "ServiceEndpoint", (url, listener) =>
                {
                    var builder = WebApplication.CreateBuilder();

                    // Inject IReliableStateManager za stateful cache
                    builder.Services.AddSingleton<IReliableStateManager>(this.StateManager);

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

    // Primer koriscenja Reliable Collections za cache aktivnih planova
    protected override async Task RunAsync(CancellationToken cancellationToken)
    {
        var planCache = await StateManager.GetOrAddAsync<IReliableDictionary<Guid, string>>("activePlanCache");

        while (!cancellationToken.IsCancellationRequested)
        {
            using var tx = StateManager.CreateTransaction();
            var count = await planCache.GetCountAsync(tx);
            await Task.Delay(TimeSpan.FromMinutes(5), cancellationToken);
        }
    }
}
