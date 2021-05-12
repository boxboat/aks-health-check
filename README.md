
## Running with Docker

Build the image

```
docker build -t aks-health-check .
```

### Option A - Run with Current User

``` bash
docker run -it --rm aks-health-check 

# Shell in the container
$ az login

$ az account set -s <subscription id>

$ aks-hc -g <resource group> -n <cluster name>

$ exit
```

### Option B - Run with Azure Service Principal and Kubernetes service account

This option walks you through running the health check with a specific Azure service account with read-only permissions and a Kubernetes service account with read-only permissions.

First, create the service principal. 

``` bash

export RESOURCE_GROUP="<resource group>"
export CLUSTER_NAME="<cluster name>"

export KEY_VAULT_NAME="<key vault name>"
export SERVICE_PRINCIPAL_CERT_NAME="aks-health-check-$CLUSTER_NAME"

export SERVICE_PRINCIPAL_TENANT=$(az account show | jq -r ".tenantId")
export SERVICE_PRINCIPAL_CERT_PATH="/tmp/service-principal.pem"

# Select the subscription where the AKS cluster is
az account set -s <subscription id>

# Create the service principal
export SERVICE_PRINCIPAL_CLIENT_ID=$(az ad sp create-for-rbac --name "aks-health-check-for-$CLUSTER_NAME" --create-cert | jq -r '.appId')

# Example Output:
# Please copy /home/fgauna/tmpjpv0sqts.pem to a safe place. When you run 'az login', provide the file path in the --password argument

```
Then, create the Kubernetes service account.

```
todo
```

Lastly, put it all together and run the health check with the service principals.

``` bash



# (Optional) - Upload the cert to a key vault
az keyvault certificate import -f $SERVICE_PRINCIPAL_CERT_PATH -n $SERVICE_PRINCIPAL_CERT_NAME --vault-name $KEY_VAULT_NAME

docker run -v $SERVICE_PRINCIPAL_CERT_PATH:/cert/az.pem -it --rm aks-health-check \
    az login --service-principal -u $SERVICE_PRINCIPAL_CLIENT_ID -p /cert/az.pem --tenant $SERVICE_PRINCIPAL_TENANT && \
    aks-hc -g $RESOURCE_GROUP -n $CLUSTER_NAME
```

```
az group create -n rg-akshc-dev -l eastus --tag customer=Internal owner=Facundo

MANAGED_IDENTITY_CLIENT_ID=$(az identity create -n identity-aks-health-check -g rg-akshc-dev -l eastus | jq -r '.id')

az role assignment create --role Contributor --assignee $MANAGED_IDENTITY_CLIENT_ID

export STORAGE_ACCOUNT="stbbakshclogs"
export FILESHARE_NAME="logs"
export RESOURCE_GROUP="rg-akshc-dev"

az storage account create -n $STORAGE_ACCOUNT -g $RESOURCE_GROUP

STORAGE_ACCOUNT_KEY=$(az storage account keys list -n $STORAGE_ACCOUNT -g $RESOURCE_GROUP | jq -r ".[0].value")

az storage share create --account-name $STORAGE_ACCOUNT --account-key $STORAGE_ACCOUNT_KEY -n $FILESHARE_NAME

az container create --resource-group rg-boxup-test-001 -l eastus -n aks-health-check \
OUTPUT_FILE_NAME=/var/logs/akshc/log$(date +%s).txt --image boxboatregistry.azurecr.io/aks-health-check:pre-1.0.0 --assign-identity 
--azure-file-volume-share-name $FILESHARE_NAME --azure-file-volume-account-name $STORAGE_ACCOUNT --azure-file-volume-account-key $STORAGE_ACCOUNT_KEY --azure-file-volume-mount-path /var/logs/akshc
```


#### Clean Up

Remove the certificate.

```
rm /tmp/service-principal.pem
```

Then removing the service account from Kubernetes.

``` bash

```

Lastly, remove the service account from Azure.

``` bash

```

## Developing

First, `npm install`.

In VS Code, open the command patellete, then select **Debug: Toggle Auto-Attach** so that any new NodeJS application will attach the VS Code debugger.

Then, from the VS Code terminal, invoke the CLI tool by running it against a cluster.

``` bash
npm start -- -g <cluster resource group> -n <cluster name>
```