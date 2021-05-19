import chalk from "chalk"
import { equalsIgnoreCase } from '../helpers/stringCompare.js';
import { executeCommand } from '../helpers/commandHelpers.js';
import { ResultStatus } from '../helpers/commandStatus.js';
import { Severity } from '../helpers/commandSeverity.js';


//
// Checks for the 'only use allowed images' policy
//
export function checkForAllowedImages(constraintTemplates) {

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

  return {
    checkId: 'IM-1',
    status: constraintDefined.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.High
  }
}

//
// Checks for 'no privileged containers' policy
//
export function checkForNoPrivilegedContainers(constraintTemplates) {

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

  return {
    checkId: 'IM-2',
    status: constraintDefined.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.High
  }
}

//
// Checks that the Azure Container Registries are setup to allow RBAC from the AKS nodes
//
export async function checkForAksAcrRbacIntegration(clusterDetails, containerRegistries) {

  console.log(chalk.white("Checking for ACR/AKS RBAC integration for pulling images..."));

  // Grab the kubelet identity from identity profile
  var identityProfile = clusterDetails.identityProfile;
  var kubeletIdentityObjectId = identityProfile && identityProfile.kubeletidentity.objectId;

  // If the kubelet identity object id is null, attempt to grab from service principal client id
  if (!kubeletIdentityObjectId) {
    try {
      var clientId = clusterDetails.servicePrincipalProfile && clusterDetails.servicePrincipalProfile.clientId;
      if (clientId) {
        var commandResults = await executeCommand(`az ad sp list --all --query "[?@.appId=='${clientId}']"`);
        var appDetails = JSON.parse(commandResults.stdout);
        kubeletIdentityObjectId = appDetails && appDetails.length && appDetails[0].objectId;
      }
    }
    catch (e) {
      console.log(chalk.red(`--- An error occurred retrieving all service principals: ${e}`));
    }
  }

  // Sanity check cluster identity
   if (!kubeletIdentityObjectId) {
     console.log(chalk.red('--- Could not determine cluster identity. Stopping check.'));
     return {
      checkId: 'IM-3',
      status: ResultStatus.Fail,
      severity: Severity.High
    }
   }

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

  return {
    checkId: 'IM-3',
    status: !problemRegistries.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.High
  }
}

//
// Checks that private endpoints are enabled for container registries
//
export function checkForPrivateEndpointsOnRegistries(containerRegistries) {

  console.log(chalk.white("Checking for private endpoints on container registries..."));

  // Grab all registries without private endpoints
  var problemRegistries = containerRegistries
    .filter(x => x.privateEndpointConnections.length == 0);

  // Log output
  if (problemRegistries.length) {
    console.log(chalk.red(`--- ${problemRegistries.length} registries did not have private endpoints configured`));
  } else {
    console.log(chalk.green("--- All registries have private endpoints configured"));
  }

  return {
    checkId: 'IM-4',
    status: !problemRegistries.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.Medium
  }
}

//
// Checks for known runtime container security tools
//
export function checkForRuntimeContainerSecurity(pods) {

  console.log(chalk.white("Checking for runtime container security tools..."));

  // Determine if Aqua (kube-enforcer) is installed
  var aquaInstalled = pods
    .items
    .some(pod => pod.spec.containers.some(con => equalsIgnoreCase(con.name, "kube-enforcer")));

  // Determine if Anchore is installed
  var anchoreInstalled = pods
    .items
    .some(pod => pod.spec.containers.some(con => con.image.match(/anchore-engine/i)));

  // Determine if Palo-Alto is installed
  var paloAltoInstalled = pods
    .items
    .some(pod => pod.spec.containers.some(con => con.image.match(/twistlock/i)));

  // If none of the known tools are installed, log an error
  // Otherwise log the tool that was found
  var knownToolInstalled = aquaInstalled || anchoreInstalled || paloAltoInstalled;
  if (!knownToolInstalled) {
    console.log(chalk.red(`--- A runtime container security tool was not found`));
  }
  else {
    if (aquaInstalled) console.log(chalk.green(`--- Aqua Kube-Enforcer was found`));
    if (anchoreInstalled) console.log(chalk.green(`--- Anchore Engine was found`));
    if (paloAltoInstalled) console.log(chalk.green(`--- Palo Alto Twistlock was found`));
  }

  return {
    checkId: 'IM-4',
    status: knownToolInstalled? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.Medium
  }
}