
# BoxBoat's AKS Health Check

This is a client-side tool that uses the Azure CLI to [AKS Best Practice](https://www.the-aks-checklist.com/) checks against the Azure plane and the Kubernetes plane.

## Option A - Run with Current User

``` bash
docker run -it --rm aks-health-check 

# Shell in the container
$ az login

$ az aks get-credentials -g <resource group> -n <cluster name> --admin

$ az account set -s <subscription id>

$ aks-hc check all -g <resource group> -n <cluster name>

$ exit
```

## Option B - Run with Azure Service Principal

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
    --image ghcr.io/boxboat/aks-health-check:0.0.1 --assign-identity $MANAGED_IDENTITY_CLIENT_ID \
    --command-line "./start-from-aci.sh" \
    -e CLUSTER_NAME=$CLUSTER_NAME RESOURCE_GROUP=$RESOURCE_GROUP OUTPUT_FILE_NAME=/var/logs/akshc/log$(date +%s).txt \
    --restart-policy Never --azure-file-volume-share-name $FILESHARE_NAME \
    --azure-file-volume-account-name $STORAGE_ACCOUNT --azure-file-volume-account-key $STORAGE_ACCOUNT_KEY \
    --azure-file-volume-mount-path /var/logs/akshc
```

After some time, the container will spin up and run the health checks. 
The logs will be stored in the Azure file share.

### Clean Up

Remove the certificate.

``` bash
az group delete -g $RESOURCE_GROUP
```

## Developing

### Requirements

- [Node v12.22.1](https://github.com/nvm-sh/nvm)
- Azure CLI
- `kubectl`

First, `npm install`.

In VS Code, open the command patellete, then select **Debug: Toggle Auto-Attach** so that any new NodeJS application will attach the VS Code debugger.

Then, from the VS Code terminal, invoke the CLI tool by running it against a cluster.

``` bash
npm start -- -g <cluster resource group> -n <cluster name>
```
