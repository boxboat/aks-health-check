import chalk from "chalk"
import { equalsIgnoreCase } from '../helpers/stringCompare.js';
import { ResultStatus } from '../helpers/commandStatus.js';
import { Severity } from '../helpers/commandSeverity.js';
import { executeCommand } from '../helpers/commandHelpers.js';

//
// Checks if the cluster master has authorized ip ranges set
//
export function checkForAuthorizedIpRanges(clusterDetails) {
  console.log(chalk.white("Checking for authorized ip ranges..."));

  try {
    // Check if authorized ip ranges is non-null
    var authorizedIpRangesConfigured = (clusterDetails
      .apiServerAccessProfile
      .authorizedIpRanges || []).length > 0;

    // Log output
    if (!authorizedIpRangesConfigured) {
      console.log(chalk.red(`--- Authorized IP Ranges are not configured for the API server`));
    } else {
      console.log(chalk.green("--- Authorized IP Ranges are configured for the API server"));
    }

    return {
      checkId: 'CSP-2',
      status: authorizedIpRangesConfigured? ResultStatus.Pass: ResultStatus.Fail,
      severity: Severity.High
    }
  }
  catch (e) {
    console.log(chalk.red(`EXCEPTION: ${e}`));

    return {
      checkId: 'CSP-2',
      status: ResultStatus.NotApply,
      severity: Severity.High
    }
  }
  
}

//
// Checks if the cluster has Managed Azure Active Directory integration enabled
//
export function checkForManagedAadIntegration(clusterDetails) {

  console.log(chalk.white("Checking for Managed Azure Active Directory integration..."));

  // Check if managed aad integration is configured
  var aadIntegrationConfigured = clusterDetails.aadProfile && clusterDetails.aadProfile.managed;

  // Log output
  if (!aadIntegrationConfigured) {
    console.log(chalk.red(`--- Managed Azure Active Directory integration is not configured`));
  } else {
    console.log(chalk.green("--- Managed Azure Active Direectory integration is configured"));
  }

  return {
    checkId: 'CSP-3',
    status: aadIntegrationConfigured? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.High
  }
}

//
// Checks if autoscale is enabled on node pools
//
export function checkForAutoscale(clusterDetails) {

  console.log(chalk.white("Checking for Autoscale on cluster..."));

  // Check if autoscale is configured
  var autoscaleConfigured = clusterDetails.agentPoolProfiles.some(x => x.enableAutoScaling);

  // Log output
  if (!autoscaleConfigured) {
    console.log(chalk.red(`--- Autoscale is not configured`));
  } else {
    console.log(chalk.green("--- Autoscale is configured"));
  }

  return {
    checkId: 'CSP-4',
    status: autoscaleConfigured? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.Medium
  }
}

//
// Checks for the Kubernetes dashboard
//
export async function checkForKubernetesDashboard() {

  console.log(chalk.white("Checking for Kubernetes dashboard..."));

  // Because it's possible the namespace containing the dashboard was filtered out
  // we should check all namespaces in the cluster for it
  var commandResults = await executeCommand('kubectl get deployments -A --field-selector metadata.name=kubernetes-dashboard -o json');
  var commandJson = JSON.parse(commandResults.stdout);

  // Determine if dashboard is installed
  var dashboardInstalled = commandJson.items.length > 0;

  // Log output
  if (dashboardInstalled) {
    console.log(chalk.red(`--- Kubernetes dashboard is installed`));
  } else {
    console.log(chalk.green("--- Kubernetes dashboard is not installed"));
  }

  return {
    checkId: 'CSP-7',
    status: !dashboardInstalled? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.High
  }
}

//
// Checks for the existence of the most popular service meshes
//
export function checkForServiceMesh(deployments, pods) {

  console.log(chalk.white("Checking for known service meshes..."));

  // Determine if Traefik-mesh is installed
  var traefikMeshInstalled = deployments
    .items
    .some(x => x.metadata.name.match(/traefik-mesh/i));

  // Determine if Istio is installed
  var istioInstalled = pods
    .items
    .some(pod => pod.spec.containers.some(con => con.image.match(/istio/i)));

  // Determine if Consul is installed
  var consulInstalled = pods
    .items
    .some(pod => pod.spec.containers.some(con => con.image.match(/consul/i)));

  // Determine if Linkerd is installed
  var linkerdInstalled = deployments
    .items
    .some(x => x.metadata.name.match(/linkerd/i));

  // Determine if OSM is installed
  var osmInstalled = pods
    .items
    .some(pod => pod.spec.containers.some(con => con.image.match(/osm-controller/i)));

  // If none of the known meshes are installed, log an error
  // Otherwise log the mesh that was found
  var knownMeshInstalled = traefikMeshInstalled || istioInstalled || consulInstalled || linkerdInstalled || osmInstalled;
  if (!knownMeshInstalled) {
    console.log(chalk.red(`--- A service mesh was not detected`));
  }
  else {
    if (traefikMeshInstalled) console.log(chalk.green(`--- Traefik-Mesh was found`));
    if (istioInstalled) console.log(chalk.green(`--- Istio was found`));
    if (consulInstalled) console.log(chalk.green(`--- Consul was found`));
    if (linkerdInstalled) console.log(chalk.green(`--- Linkerd was found`));
    if (osmInstalled) console.log(chalk.green(`--- Open Service Mesh was found`));
  }

  return {
    checkId: 'CSP-8',
    status: ResultStatus.NotApply,
    severity: Severity.Informational
  }
}

//
// Check if a cluster has multiple node pools
//
export function checkForMultipleNodePools(clusterDetails) {

  console.log(chalk.white("Checking for multiple node pools on cluster..."));

  // Check if multiple node pools are configured
  var multipleNodePoolsConfigured = clusterDetails.agentPoolProfiles.length > 1;

  // Log output
  if (!multipleNodePoolsConfigured) {
    console.log(chalk.red(`--- Only one node pool exists on the cluster`));
  } else {
    console.log(chalk.green("--- Multiple node pools exist on the cluster"));
  }

  return {
    checkId: 'CSP-9',
    status: multipleNodePoolsConfigured? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.Medium
  }
}