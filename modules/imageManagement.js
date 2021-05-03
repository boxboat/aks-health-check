import chalk from "chalk"
import { equalsIgnoreCase } from '../helpers/stringCompare.js';
import { executeCommand } from '../helpers/commandHelpers.js';

//
// Checks for the 'only use allowed images' policy
//
export async function checkForAllowedImages(constraintTemplates) {

  console.log(chalk.white("Checking for 'Only use allowed images' policy..."));

  // Check if allowed images constraint is defined
  var constraintDefined = constraintTemplates
    .items
    .some(x => equalsIgnoreCase(x.metadata.name, 'k8sazurecontainerallowedimages'));

  // Log output
  if (!constraintDefined) {
    console.log(chalk.red(`--- 'Only use allowed images' policy not applied`));
  } else {
    console.log(chalk.green("--- 'Only use allowed images' policy applied"));
  }
}

//
// Checks for 'no privileged containers' policy
//
export async function checkForNoPrivilegedContainers(constraintTemplates) {

  console.log(chalk.white("Checking for 'No privileged containers' policy..."));

  // Check if no privileged containers constraint is defined
  var constraintDefined = constraintTemplates
    .items
    .some(x => equalsIgnoreCase(x.metadata.name, 'k8sazurecontainernoprivilege'));

  // Log output
  if (!constraintDefined) {
    console.log(chalk.red(`--- 'No privileged containers' policy not applied`));
  } else {
    console.log(chalk.green("--- 'No privileged containers' policy applied"));
  }
}

//
// Checks that the Azure Container Registries are setup to allow RBAC from the AKS nodes
//
export async function checkForAksAcrRbacIntegration(clusterDetails, containerRegistries) {

  console.log(chalk.white("Checking for ACR/AKS RBAC integration for pulling images..."));

  // Grab the kubelet identity
  var kubeletIdentityObjectId = clusterDetails.identityProfile.kubeletidentity.objectId;

  // Grab the roles for the identity
  var commandResults = await executeCommand(`az role assignment list --assignee '${kubeletIdentityObjectId}' --all`);
  var assignedRoles = JSON.parse(commandResults.stdout);

  // Build up the list of registries that do not have the AcrPull role defined for the kubelet identity
  var problemRegistries = [];
  containerRegistries.forEach(registry => {
    var regEx = new RegExp(`\/registries\/${registry.name}$`);
    if (!assignedRoles.some(x => x.roleDefinitionName == 'AcrPull' && regEx.test(x.scope)))
      problemRegistries.push(registry.name);  
  });

  // Log output
  if (problemRegistries.length) {
    console.log(chalk.red(`--- ${problemRegistries.length} registries did not have AKS/ACR RBAC integration`));
  } else {
    console.log(chalk.green("--- All registries have AKS/ACR RBAC integration"));
  }
}