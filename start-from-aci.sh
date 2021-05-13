#! /bin/bash
set -e

if [ -z "$CLUSTER_NAME" ]
then
    echo "Please provide the name of the AKS cluster through an environment variable 'CLUSTER_NAME'."
    exit 1
fi

if [ -z "$RESOURCE_GROUP" ]
then
    echo "Please provide the resource group of the AKS cluster through an environment variable 'RESOURCE_GROUP'."
    exit 1
fi

if [ -z "$OUTPUT_FILE_NAME" ]
then
    echo "Please provide the output file name through an environment variable 'OUTPUT_FILE_NAME'."
    exit 1
fi 

echo "Attempting Login."
az login --identity --verbose 
az aks get-credentials -g $RESOURCE_GROUP -n $CLUSTER_NAME 

echo "Logged in. Starting health check."
aks-hc check all -n $CLUSTER_NAME -g $RESOURCE_GROUP | tee $OUTPUT_FILE_NAME