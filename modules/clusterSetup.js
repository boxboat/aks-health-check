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

  let details = []

  try {
    // Check if authorized ip ranges is non-null
    var authorizedIpRangesConfigured = (clusterDetails
      .apiServerAccessProfile
      .authorizedIpRanges || []).length > 0;

    // Log output
    if (!authorizedIpRangesConfigured) {
      details.push({
        status:  ResultStatus.Fail,
        message: "Authorized IP Ranges are not configured for the API server"}
        );
    } else {
      details.push({
        status:  ResultStatus.Pass,
        message: "Authorized IP Ranges are configured for the API server"}
        );
    }

    return {
      checkId: 'CSP-2',
      status: authorizedIpRangesConfigured? ResultStatus.Pass: ResultStatus.Fail,
      severity: Severity.High,
      details: details
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

  let details = [];

  // Check if managed aad integration is configured
  var aadIntegrationConfigured = clusterDetails.aadProfile && clusterDetails.aadProfile.managed;

  // Log output
  if (!aadIntegrationConfigured) {
    details.push({
      status:  ResultStatus.Fail,
      message: "Managed Azure Active Directory integration is not configured"}
      );
  }
  else {
    details.push({
      status:  ResultStatus.Pass,
      message: "Managed Azure Active Direectory integration is configured"}
      );
  }

  return {
    checkId: 'CSP-3',
    status: aadIntegrationConfigured? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.High,
    details: details
  }
}

//
// Checks if autoscale is enabled on node pools
//
export function checkForAutoscale(clusterDetails) {

  console.log(chalk.white("Checking for Autoscale on cluster..."));

  let details = [];

  // Check if autoscale is configured
  var autoscaleConfigured = clusterDetails.agentPoolProfiles.some(x => x.enableAutoScaling);

  // Log output
  if (!autoscaleConfigured) {
    details.push({
      status:  ResultStatus.Fail,
      message: "Autoscale is not configured"}
      );
  } else {
    details.push({
      status:  ResultStatus.Pass,
      message: "Autoscale is configured"}
      );
  }

  return {
    checkId: 'CSP-4',
    status: autoscaleConfigured? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.Medium,
    details: details
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
  let details = [];

  // Determine if dashboard is installed
  var dashboardInstalled = commandJson.items.length > 0;

  // Log output
  if (dashboardInstalled) {
    details.push({
      status:  ResultStatus.Fail,
      message: "Kubernetes dashboard is installed"}
      );
  } else {
    details.push({
      status:  ResultStatus.Pass,
      message: "Kubernetes dashboard is not installed"}
      );
  }

  return {
    checkId: 'CSP-7',
    status: !dashboardInstalled? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.High,
    details: details
  }
}

//
// Checks for the existence of the most popular service meshes
//
export function checkForServiceMesh(deployments, pods) {

  console.log(chalk.white("Checking for known service meshes..."));

  let details = [];

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
    details.push({
      status:  ResultStatus.NotApply,
      message: "No service mesh installed"}
      );
  }
  else {
    let serviceMeshName = ""
    if (traefikMeshInstalled) serviceMeshName= "Traefik-Mesh";
    if (istioInstalled) serviceMeshName = "Istio";
    if (consulInstalled) serviceMeshName="Consul";
    if (linkerdInstalled) serviceMeshName="Linkerd";
    if (osmInstalled) serviceMeshName="Open Service Mesh";

    if (serviceMeshName){
      details.push({
        status:  ResultStatus.NotApply,
        message: `${serviceMeshName} was found`}
        );
    }
    
  }

  return {
    checkId: 'CSP-8',
    status: ResultStatus.NotApply,
    severity: Severity.Informational,
    details: details
  }
}

//
// Check if a cluster has multiple node pools
//
export function checkForMultipleNodePools(clusterDetails) {

  console.log(chalk.white("Checking for multiple node pools on cluster..."));

  let details = [];

  // Check if multiple node pools are configured
  var multipleNodePoolsConfigured = clusterDetails.agentPoolProfiles.length > 1;

  // Log output
  if (!multipleNodePoolsConfigured) {
    details.push({
      status:  ResultStatus.Fail,
      message: "Only one node pool exists on the cluster"}
      );
  }

  return {
    checkId: 'CSP-9',
    status: multipleNodePoolsConfigured? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.Medium,
    details: details
  }
}
