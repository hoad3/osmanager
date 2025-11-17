namespace OSManager.Service.FirewallRule;

public interface IFirewallService
{
    List<FirewallRule> GetFirewallRulesViaSsh(FirewallRule request, int commandTimeoutSec = 10);
    
}