import chalk from "chalk"
import { equalsIgnoreCase } from '../helpers/stringCompare.js';

//
// Checks if the cluster master has authorized ip ranges set
//
export function checkForAuthorizedIpRanges(clusterDetails) {

  console.log(chalk.white("Checking for authorized ip ranges..."));

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
}

//
// Checks for the Kubernetes dashboard
//
export function checkForKubernetesDashboard(pods) {

  console.log(chalk.white("Checking for Kubernetes dashboard..."));

  // Determine if dashboard is installed
  var dashboardInstalled = pods
    .items
    .some(pod => pod.spec.containers.some(con => equalsIgnoreCase(con.name, "kubernetes-dashboard")));

  // Log output
  if (dashboardInstalled) {
    console.log(chalk.red(`--- Kubernetes dashboard is installed`));
  } else {
    console.log(chalk.green("--- Kubernetes dashboard is not installed"));
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
}