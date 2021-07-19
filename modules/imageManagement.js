import chalk from "chalk"
import { equalsIgnoreCase } from '../helpers/stringCompare.js';
import { executeCommand } from '../helpers/commandHelpers.js';
import { ResultStatus } from '../helpers/commandStatus.js';
import { Severity } from '../helpers/commandSeverity.js';
import { EOL } from 'os';

const space = '            '

//
// Checks for the 'only use allowed images' policy
//
export function checkForAllowedImages(constraintTemplates) {

  console.log(chalk.white("Checking for 'Only use allowed images' policy..."));

  let details = []

  // Check if allowed images constraint is defined
  var constraintDefined = constraintTemplates
    .items
    .some(x => equalsIgnoreCase(x.metadata.name, 'k8sazurecontainerallowedimages'));

  // Log output
  if (!constraintDefined) {
    details.push({
      status: ResultStatus.Fail,
      message: "Only 'use allowed images' policy not applied"
    }
    );
  } else {
    details.push({
      status: ResultStatus.Pass,
      message: "'Only use allowed images' policy applied"
    }
    );
  }

  return {
    checkId: 'IMG-3',
    status: constraintDefined.length ? ResultStatus.Pass : ResultStatus.Fail,
    severity: Severity.High,
    details: details
  }
}

//
// Checks for known runtime container security tools
//
export function checkForRuntimeContainerSecurity(pods) {

  console.log(chalk.white("Checking for runtime container security tools..."));

  let details = []

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
    details.push({
      status: ResultStatus.Fail,
      message: "A runtime container security tool was not found"
    }
    );
  }
  else {
    let message = "";
    if (aquaInstalled) message = "Aqua Kube-Enforcer was found";
    if (anchoreInstalled) message = "Anchore Engine was found";
    if (paloAltoInstalled) message = "Palo Alto Twistlock was found";

    details.push({
      status: ResultStatus.Pass,
      message: message
    }
    );
  }

  return {
    checkId: 'IMG-4',
    status: knownToolInstalled ? ResultStatus.Pass : ResultStatus.Fail,
    severity: Severity.Medium,
    details: details
  }
}

//
// Checks that the Azure Container Registries are setup to allow RBAC from the AKS nodes
//
export async function checkForAksAcrRbacIntegration(clusterDetails, containerRegistries) {

  console.log(chalk.white("Checking for ACR/AKS RBAC integration for pulling images..."));

  let details = []

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
    details.push({
      status: ResultStatus.Pass,
      message: "Could not determine cluster identity. Stopping check."
    }
    );
    return {
      checkId: 'IMG-5',
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
    let message = `${problemRegistries.length} registries did not have AKS/ACR RBAC integration`;

    if (global.verbose) {
      problemRegistries.forEach(x => message += `${EOL}${space}${x}`);
    }

    details.push({
      status: ResultStatus.Fail,
      message: message
    }
    );
  } else {
    details.push({
      status: ResultStatus.Pass,
      message: "All registries have AKS/ACR RBAC integration"
    }
    );
  }

  return {
    checkId: 'IMG-5',
    status: !problemRegistries.length ? ResultStatus.Pass : ResultStatus.Fail,
    severity: Severity.High,
    details: details
  }
}

//
// Checks that private endpoints are enabled for container registries
//
export function checkForPrivateEndpointsOnRegistries(containerRegistries) {

  console.log(chalk.white("Checking for private endpoints on container registries..."));

  let details = []

  // If there are no container registries the test does not apply
  if (!containerRegistries.length) {
    details.push({
      status: ResultStatus.NotApply,
      message: "No registries were specified. Skipping check"
    }
    );

    return {
      checkId: 'IMG-6',
      status: ResultStatus.NotApply,
      severity: Severity.Medium
    }
  }

  // Grab all registries without private endpoints
  var problemRegistries = containerRegistries
    .filter(x => x.privateEndpointConnections.length == 0);

  // Log output
  if (problemRegistries.length) {
    let message = `${problemRegistries.length} registries did not have private endpoints configured`;

    if (global.verbose) {
      problemRegistries.forEach(x => message += `${EOL}${space}${x.name}`);
    }

    details.push({
      status: ResultStatus.Fail,
      message: message
    }
    );
  } else {
    details.push({
      status: ResultStatus.Pass,
      message: 'All registries have private endpoints configured'
    }
    );
  }

  return {
    checkId: 'IMG-6',
    status: !problemRegistries.length ? ResultStatus.Pass : ResultStatus.Fail,
    severity: Severity.Medium,
    details: details
  }
}

//
// Checks for 'no privileged containers' policy
//
export function checkForNoPrivilegedContainers(constraintTemplates) {

  console.log(chalk.white("Checking for 'No privileged containers' policy..."));

  let details = []

  // Check if no privileged containers constraint is defined
  var constraintDefined = constraintTemplates
    .items
    .some(x => equalsIgnoreCase(x.metadata.name, 'k8sazurecontainernoprivilege'));

  // Log output
  if (!constraintDefined) {
    details.push({
      status: ResultStatus.Fail,
      message: "'No privileged containers' policy not applied"
    }
    );
  } else {
    console.log(chalk.green("--- 'No privileged containers' policy applied"));
    details.push({
      status: ResultStatus.Pass,
      message: "No privileged containers' policy applied"
    }
    );
  }

  return {
    checkId: 'IMG-8',
    status: constraintDefined.length ? ResultStatus.Pass : ResultStatus.Fail,
    severity: Severity.High,
    details: details
  }
}