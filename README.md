
# BoxBoat's AKS Health Check

[![Known Vulnerabilities](https://snyk.io/test/github/boxboat/aks-health-check/badge.svg)](https://snyk.io/test/github/boxboat/aks-health-check)

This is a client-side tool that uses the Azure CLI and `kubectl` to perform checks against the Azure plane and the Kubernetes plane. These checks are well documented on [Microsoft's documentation](https://docs.microsoft.com/en-us/azure/aks/best-practices).

At BoxBoat, we guide our customers with the use of Kubernetes and surrounding ecosystems. To offer the most value possible to our clients, we created a tool to quickly inspect the configuration of an AKS cluster and it's relevant Azure environment. 

There are many best-practices and some of these are subjective. So, we also have a companion Google Doc template that we use to keep track of results and findings.

📢 [Blog Post](https://boxboat.com/2021/08/04/aks-health-check/)

🎞️ [Hands on video](https://youtu.be/iQyBfon81uk)

📄 [The Google Doc AKS Health Check Template](https://bit.ly/boxboat-health-check-report-template-v2) 📄

## Overview

![carbon (5)](https://user-images.githubusercontent.com/1071270/162533343-ccba3412-b0cd-4d3c-8cf7-0f579c6054b0.png)

### Note about Private Clusters 👀

If your machine cannot reach the Kubernetes API endpoint in the private AKS cluster, then you will only be able to perform Azure checks (`aks-hc check azure`). To perform Kubernetes checks, you will have to use a bastion machine or be connected to the private network where the private cluster is deployed.

## Option A - Run with Current User (Preferred 🌟) 

Whoever is performing the health check, has to be able to use Docker and be a cluster administrator.

``` bash
docker run -it --network host --rm ghcr.io/boxboat/aks-health-check

# Shell in the container
$ az login

$ az account set -s <subscription id>

$ az aks get-credentials -g <resource group> -n <cluster name>

# Verify that you can interact with Kubernets 
$ kubectl get ns

# aks-hc check all - checks both Azure and Kubernetes configuration
# aks-hc check kubernetes - checks only Kubernetes
# aks-hc check azure - checks only Azure
# aks-hc help - get some help
$ aks-hc check all -g <resource group> -n <cluster name> -i ingress-nginx,kube-node-lease,kube-public,kube-system

# Receive the results

$ exit # Leave the container
```

### Optional - Check the Azure Container Registry

If you use Azure Container Registry (ACR), you can have this health check review some basic configuration. If will not inspect container images pushed to the registry. 

To do this, look at the container registries available then specify the `--image-registries` option. If the container registry is in a separate subscription than the AKS cluster, you may use the format '{subscription id}:{registry name}' to specify the subscription (ie: 1234-56-7890:myregistry).

``` bash
$ az acr list --query "[].name"
foo1
foo2

$ aks-hc check all -g <resource group> -n <cluster name> -i ingress-nginx,kube-node-lease,kube-public,kube-system --image-registries "foo1,foo2"
```

## Option B - Run with Managed Identity

This option walks you through running the health check using an Azure Managed Identity so that it can be tied to a "service principal". Essentially, it avoids impersoning a user or running with someone's identity.

First, select the Azure subscription.
``` bash
az account set -s <subscription id>
```

Then, set some variables and create a resource group for the container instance.
``` bash
export STORAGE_ACCOUNT="<storage account for logs>"
export FILESHARE_NAME="logs"
export HEALTH_CHECK_RESOURCE_GROUP="<resource group for health check resources>"
export RESOURCE_GROUP="<cluster resource group>"
export LOCATION="eastus"
export MANAGED_IDENTITY_NAME="identity-aks-health-check"

az group create -n $HEALTH_CHECK_RESOURCE_GROUP -l $LOCATION
```

Next, create an Azure managed identity so that the Azure container instance can authenticate with Kubernetes.

``` bash

MANAGED_IDENTITY_CLIENT_ID=$(az identity create -n $MANAGED_IDENTITY_NAME -g $HEALTH_CHECK_RESOURCE_GROUP -l $LOCATION | jq -r '.id')

# for the kubernetes checks
az role assignment create --role "Azure Kubernetes Service Cluster Admin Role" --assignee $MANAGED_IDENTITY_CLIENT_ID
# for the Azure checks
az role assignment create --role "Reader" --assignee $MANAGED_IDENTITY_CLIENT_ID

```

Then, create a storage account with an Azure file share to place our aks-health-check logs. 

``` bash
az storage account create -n $STORAGE_ACCOUNT -g $HEALTH_CHECK_RESOURCE_GROUP

STORAGE_ACCOUNT_KEY=$(az storage account keys list -n $STORAGE_ACCOUNT -g $HEALTH_CHECK_RESOURCE_GROUP | jq -r ".[0].value")

az storage share create --account-name $STORAGE_ACCOUNT --account-key $HEALTH_CHECK_RESOURCE_GROUP -n $FILESHARE_NAME
```

Finally, we can spin up an Azure container instance running the AKS Health Check.
``` bash
# Set the container admin registry password
read CONTAINER_REGISTRY_PASSWORD
az container create --resource-group $RESOURCE_GROUP -l eastus -n aks-health-check\
    --image ghcr.io/boxboat/aks-health-check --assign-identity $MANAGED_IDENTITY_CLIENT_ID \
    --command-line "./start-from-aci.sh" \
    -e CLUSTER_NAME=$CLUSTER_NAME RESOURCE_GROUP=$RESOURCE_GROUP OUTPUT_FILE_NAME=/var/logs/akshc/log$(date +%s).txt \
    --restart-policy Never --azure-file-volume-share-name $FILESHARE_NAME \
    --azure-file-volume-account-name $STORAGE_ACCOUNT --azure-file-volume-account-key $STORAGE_ACCOUNT_KEY \
    --azure-file-volume-mount-path /var/logs/akshc
```

After some time, the container will spin up and run the health checks. 
The logs will be stored in the Azure file share.

### Clean Up

``` bash
az group delete -g $RESOURCE_GROUP
```

## The Checks

There are about 50+ best-practice recommendations for Azure Kubernetes Service (AKS). This tool helps the discovery and examination of a number of those checks. The rest are either not automated yet, or they will never be since they require more context about the business, a conversation, and ultimately a judgement call.

| Check ID    | Manual/Automated | Description |
| ----------- | ---------------- | ---------------- |
| `DEV-1`     | Automated | Implement a proper liveness probe |
| `DEV-2`     | Automated | Implement a proper readiness/startup probe |
| `DEV-3`     | Automated | Implement a proper prestop hook |
| `DEV-4`     | Automated | Run more than one replica for your deployments |
| `DEV-5`     | Automated | Apply tags to all resources |
| `DEV-6`     | Automated | Implement autoscaling of your applications |
| `DEV-7`     | Automated | Store secrets in azure key vault |
| `DEV-8`     | Automated | Implement pod identity |
| `DEV-9`     | Automated | Use kubernetes namespaces |
| `DEV-10`    | Automated | Setup resource requests and limits on containers |
| `DEV-11`    | Automated | Specify security context for pods or containers |
| `DEV-12`    | Automated | Configure pod disruption budgets |
| `IMG-1`     | Manual    | Define image security best practices |
| `IMG-2`     | Manual    | Scan container images during CI/CD pipelines |
| `IMG-3`     | Automated | Allow pulling containers only from allowed registries |
| `IMG-4`     | Automated | Enable runtime security for containerized applications |
| `IMG-5`     | Automated | Configure image pull RBAC for azure container registry |
| `IMG-6`     | Automated | Isolate azure container registries |
| `IMG-7`     | Manual    | Utilize minimal base images |
| `IMG-8`     | Automated | Forbid the use of privileged containers |
| `CSP-1`     | Manual    | Logically isolate the cluster |
| `CSP-2`     | Automated | Isolate the Kubernetes control plane |
| `CSP-3`     | Automated | Enable Azure AD integration |
| `CSP-4`     | Automated | Enable cluster autoscaling |
| `CSP-5`     | Manual    | Ensure nodes are correctly sized |
| `CSP-6`     | Manual    | Create a process for base image updates |
| `CSP-7`     | Automated | Ensure the Kubernetes dashboard is not installed |
| `CSP-8`     | Automated | Use system and user node pools |
| `CSP-9`     | Automated | Enable Azure Policy |
| `CSP-10`    | Automated | Enable Azure RBAC |
| `DR-1`      | Manual    | Ensure you can perform a whitespace deployment |
| `DR-2`      | Automated | Use availability zones for node pools |
| `DR-3`      | Manual    | Plan for a multi-region deployment |
| `DR-4`      | Manual    | Use Azure traffic manager for cross-region traffic |
| `DR-5`      | Automated | Create a storage migration plan |
| `DR-6`      | Automated | Guarantee SLA for the master control plane |
| `DR-7`      | Automated | Container registry has geo-replication |
| `STOR-1`    | Manual    | Choose the right storage type |
| `STOR-2`    | Manual    | Size nodes for storage needs |
| `STOR-3`    | Manual    | Dynamically provision volumes when applicable |
| `STOR-4`    | Manual    | Secure and back up your data |
| `STOR-5`    | Manual    | Remove service state from inside containers |
| `NET-1`     | Manual    | Choose an appropriate network model |
| `NET-2`     | Manual    | Plan IP addressing carefully |
| `NET-3`     | Manual    | Distribute ingress traffic |
| `NET-4`     | Manual    | Secure exposed endpoints with a Web Application Firewall (WAF) |
| `NET-5`     | Manual    | Don’t expose ingress on public internet if not necessary |
| `NET-6`     | Automated | Control traffic flow with network policies |
| `NET-7`     | Manual    | Route egress traffic through a firewall |
| `NET-8`     | Manual    | Do not expose worker nodes to public internet |
| `NET-9`     | Automated | Utilize a service mesh (optional) |
| `NET-10`    | Manual    | Configure distributed tracing |
| `CSM-1`     | Manual    | Keep Kubernetes version up to date |
| `CSM-2`     | Manual    | Keep nodes up to date and patched |
| `CSM-3`     | Manual    | Monitor cluster security using Azure Security Center |
| `CSM-4`     | Manual    | Provision a log aggregation tool |
| `CSM-5`     | Manual    | Enable master node logs |
| `CSM-6`     | Manual    | Collect metrics |


## Special Thanks 🙏

This project was inspired by the great work of [The AKS Checklist](https://www.the-aks-checklist.com/). Without seeing this, we would have not embarked on this journey.
We were excited because it seemed like a great way to quickly go through MSFT's best practices, then build a report. 
Through practice, we decided to create a Google Doc for the report instead. This allowed us to provide more nuanced answers like "it depends" or "yes, but" or "no, but". 

## Developing

### Requirements

- [Node v12.22.1](https://github.com/nvm-sh/nvm)
- Azure CLI
- `kubectl`

First, `npm install`.

In VS Code, open the command patellete, then select **Debug: Toggle Auto-Attach** so that any new NodeJS application will attach the VS Code debugger.
Select the "Smart" mode.

Then, from the VS Code terminal, invoke the CLI tool by running it against a cluster.

``` bash
az login 
az set -s <subscription id>
az aks get-credentials -n <cluster name> -g <resource group> --admin
npm start -- check azure -g <cluster resource group> -n <cluster name>
```

### Running against Kind

``` bash
docker build --network host -t aks-health-check .

kind create cluster
kubectl cluster-info --context kind-kind

# verify that you can talk to the local kind cluster
kubectl get ns

# run aks health check for only Kubernetes and mount the local kube config file
docker run -it --network host --rm -v ~/.kube/config:/home/boxboat/.kube/config aks-health-check

# verify that you can talk to the local kind cluster
$ kubectl get ns

$ aks-hc check kubernetes -i ingress-nginx,kube-node-lease,kube-public,kube-system

```
