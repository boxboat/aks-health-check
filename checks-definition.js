export default
[
    {
        "checkId": "DEV-1",
        "description": "Implement a proper liveness probe"
    },
    {
        "checkId": "DEV-2",
        "description": "Implement a proper readiness/startup probe"
    },
    {
        "checkId": "DEV-3",
        "description": "Implement a proper prestop hook"
    },
    {
        "checkId": "DEV-4",
        "description": "Run more than one replica for your deployments"
    },
    {
        "checkId": "DEV-5",
        "description": "Apply tags to all resources"
    },
    {
        "checkId": "DEV-6",
        "description": "Implement autoscaling of your applications"
    },
    {
        "checkId": "DEV-7",
        "description": "Store secrets in azure key vault"
    },
    {
        "checkId": "DEV-8",
        "description": "Implement pod identity"
    },
    {
        "checkId": "DEV-9",
        "description": "Use kubernetes namespaces"
    },
    {
        "checkId": "DEV-10",
        "description": "Setup resource requests and limits on containers"
    },
    {
        "checkId": "DEV-11",
        "description": "Specify security context for pods or containers"
    },
    {
        "checkId": "DEV-12",
        "type": "Manual",
        "description": "Configure pod disruption budgets"
    },
    {
        "checkId": "IMG-1",
        "type": "Manual",
        "description": "Define image security best practices"
    },
    {
        "checkId": "IMG-2",
        "type": "Manual",
        "description": "Scan container images during CI/CD pipelines"
    },
    {
        "checkId": "IMG-3",
        "description": "Allow pulling containers only from allowed registries"
    },
    {
        "checkId": "IMG-4",
        "description": "Enable runtime security for containerized applications"
    },
    {
        "checkId": "IMG-5",
        "description": "Configure image pull RBAC for azure container registry"
    },
    {
        "checkId": "IMG-6",
        "description": "Isolate azure container registries"
    },
    {
        "checkId": "IMG-7",
        "type": "Manual",
        "description": "Utilize minimal base images"
    },
    {
        "checkId": "IMG-8",
        "type": "Manual",
        "description": "Forbid the use of privileged containers"
    },
    {
        "checkId": "CSP-1",
        "type": "Manual",
        "description": "Logically isolate the cluster"
    },
    {
        "checkId": "CSP-2",
        "description": "Isolate the Kubernetes control plane"
    },
    {
        "checkId": "CSP-3",
        "description": "Enable Azure AD integration"
    },
    {
        "checkId": "CSP-4",
        "description": "Enable cluster autoscaling"
    },
    {
        "checkId": "CSP-5",
        "type": "Manual",
        "description": "Ensure nodes are correctly sized"
    },
    {
        "checkId": "CSP-6",
        "type": "Manual",
        "description": "Create a process for base image updates"
    },
    {
        "checkId": "CSP-7",
        "description": "Ensure the Kubernetes dashboard is not installed"
    },
    {
        "checkId": "CSP-8",
        "type": "Manual",
        "description": "Use Azure AD to pull container images"
    },
    {
        "checkId": "CSP-9",
        "type": "Manual",
        "description": "Use system and user node pools"
    },
    {
        "checkId": "DR-1",
        "type": "Manual",
        "description": "Ensure you can perform a whitespace deployment"
    },
    {
        "checkId": "DR-2",
        "description": "Use availability zones for node pools"
    },
    {
        "checkId": "DR-3",
        "type": "Manual",
        "description": "Plan for a multi-region deployment"
    },
    {
        "checkId": "DR-4",
        "type": "Manual",
        "description": "Use Azure traffic manager for cross-region traffic"
    },
    {
        "checkId": "DR-5",
        "description": "Create a storage migration plan"
    },
    {
        "checkId": "DR-6",
        "description": "Guarantee SLA for the master control plane"
    },
    {
        "checkId": "DR-7",
        "type": "Manual",
        "description": "Container registry has geo-replication"
    },
    {
        "checkId": "STOR-1",
        "type": "Manual",
        "description": "Choose the right storage type"
    },
    {
        "checkId": "STOR-2",
        "type": "Manual",
        "description": "Size nodes for storage needs"
    },
    {
        "checkId": "STOR-3",
        "type": "Manual",
        "description": "Dynamically provision volumes when applicable"
    },
    {
        "checkId": "STOR-4",
        "type": "Manual",
        "description": "Secure and back up your data"
    },
    {
        "checkId": "STOR-5",
        "type": "Manual",
        "description": "Remove service state from inside containers"
    },
    {
        "checkId": "NET-1",
        "type": "Manual",
        "description": "Choose an appropriate network model"
    },
    {
        "checkId": "NET-2",
        "type": "Manual",
        "description": "Plan IP addressing carefully"
    },
    {
        "checkId": "NET-3",
        "type": "Manual",
        "description": "Distribute ingress traffic"
    },
    {
        "checkId": "NET-4",
        "type": "Manual",
        "description": "Secure exposed endpoints with a Web Application Firewall (WAF)"
    },
    {
        "checkId": "NET-5",
        "type": "Manual",
        "description": "Dont expose ingress on public internet if not necessary"
    },
    {
        "checkId": "NET-6",
        "type": "Manual",
        "description": "Control traffic flow with network policies"
    },
    {
        "checkId": "NET-7",
        "type": "Manual",
        "description": "Route egress traffic through a firewall"
    },
    {
        "checkId": "NET-8",
        "type": "Manual",
        "description": "Do not expose worker nodes to public internet"
    },
    {
        "checkId": "CSM-1",
        "type": "Manual",
        "description": "Keep Kubernetes version up to date"
    },
    {
        "checkId": "CSM-2",
        "type": "Manual",
        "description": "Keep nodes up to date and patched"
    },
    {
        "checkId": "CSM-3",
        "type": "Manual",
        "description": "Monitor cluster security using Azure Security Center"
    },
    {
        "checkId": "CSM-4",
        "type": "Manual",
        "description": "Provision a log aggregation tool"
    },
    {
        "checkId": "CSM-5",
        "type": "Manual",
        "description": "Enable master node logs"
    },
    {
        "checkId": "CSM-6",
        "type": "Manual",
        "description": "Collect metrics"
    },
    {
        "checkId": "CSM-7",
        "type": "Manual",
        "description": "Configure distributed tracing"
    },
    {
        "checkId": "CSM-8",
        "type": "Manual",
        "description": "Enable Azure Policy"
    }
]