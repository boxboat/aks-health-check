
# BoxBoat's AKS Health Check

This is a client-side tool that uses the Azure CLI to [AKS Best Practice](https://www.the-aks-checklist.com/) checks against the Azure plane and the Kubernetes plane.

## Option A - Run with Current User

``` bash
# build the container
docker build -t aks-health-check .

docker run -it --rm aks-health-check 

# Shell in the container
$ az login

$ az account set -s <subscription id>

$ aks-hc -g <resource group> -n <cluster name>

$ exit
```

## Option B - Run with Azure Service Principal and Kubernetes service account

This option walks you through running the health check using an Azure Managed Identity so that it can be tied to a "service principal". Essentially, it avoids impersoning a user or running with someone's identity.

Step zero, build the container image and push it your Azure Container Registry.

``` bash
# build the container
docker build -t aks-health-check .
```

First, create the service principal. 
``` bash
export RESOURCE_GROUP="<resource group>"
export CLUSTER_NAME="<cluster name>"

export SERVICE_PRINCIPAL_TENANT=$(az account show | jq -r ".tenantId")
export SERVICE_PRINCIPAL_CERT_PATH="/tmp/service-principal.pem"

# Select the subscription where the AKS cluster is
az account set -s <subscription id>

# Create the service principal
export SERVICE_PRINCIPAL_CLIENT_ID=$(az ad sp create-for-rbac --name "aks-health-check-for-$CLUSTER_NAME" --create-cert | jq -r '.appId')

```
Then, set some variables and create a resource group for the container instance.
``` bash
export STORAGE_ACCOUNT="stbbakshclogs"
export FILESHARE_NAME="logs"
export RESOURCE_GROUP="rg-akshc-dev"
export LOCATION="eastus"
export MANAGED_IDENTITY_NAME="identity-aks-health-check"
export CONTAINER_REGISTRY_USERNAME="BoxBoatRegistry"

az group create -n $RESOURCE_GROUP -l $LOCATION
```

Next, create an Azure managed identity so that the Azure container instance can authenticate with Kubernetes.

``` bash

MANAGED_IDENTITY_CLIENT_ID=$(az identity create -n $MANAGED_IDENTITY_NAME -g $RESOURCE_GROUP -l $LOCATION | jq -r '.id')

# for the kubernetes checks
az role assignment create --role "Azure Kubernetes Service Cluster Admin Role" --assignee $MANAGED_IDENTITY_CLIENT_ID
# for the Azure checks
az role assignment create --role "Reader" --assignee $MANAGED_IDENTITY_CLIENT_ID

```

Then, create a storage account with an Azure file share to place our aks-health-check logs. 

``` bash
az storage account create -n $STORAGE_ACCOUNT -g $RESOURCE_GROUP

STORAGE_ACCOUNT_KEY=$(az storage account keys list -n $STORAGE_ACCOUNT -g $RESOURCE_GROUP | jq -r ".[0].value")

az storage share create --account-name $STORAGE_ACCOUNT --account-key $STORAGE_ACCOUNT_KEY -n $FILESHARE_NAME
```

Finally, we can spin up an Azure container instance running the AKS Health Check.
``` bash
# Set the container admin registry password
read CONTAINER_REGISTRY_PASSWORD
az container create --resource-group $RESOURCE_GROUP -l eastus -n aks-health-check\
    --image boxboatregistry.azurecr.io/aks-health-check:pre-1.0.6 --assign-identity $MANAGED_IDENTITY_CLIENT_ID \
    --registry-username $AZURE_CONTAINER_REGISTRY \
    --registry-password $CONTAINER_REGISTRY_PASSWORD  \
    --command-line "./start-from-aci.sh" \
    -e CLUSTER_NAME=aks-boxup-001-aks RESOURCE_GROUP=rg-boxup-test-001 OUTPUT_FILE_NAME=/var/logs/akshc/log$(date +%s).txt --restart-policy Never --azure-file-volume-share-name $FILESHARE_NAME --azure-file-volume-account-name $STORAGE_ACCOUNT --azure-file-volume-account-key $STORAGE_ACCOUNT_KEY --azure-file-volume-mount-path /var/logs/akshc
```

After some time, the container will spin up and run the health checks. 
The logs will be stored in the Azure file share.

### Clean Up

Remove the certificate.

``` bash
az group delete -g $RESOURCE_GROUP
```

## Developing

First, `npm install`.

In VS Code, open the command patellete, then select **Debug: Toggle Auto-Attach** so that any new NodeJS application will attach the VS Code debugger.

Then, from the VS Code terminal, invoke the CLI tool by running it against a cluster.

``` bash
npm start -- -g <cluster resource group> -n <cluster name>
```