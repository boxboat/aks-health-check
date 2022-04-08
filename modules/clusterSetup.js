import chalk from "chalk"
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
    checkId: 'CSP-8',
    status: multipleNodePoolsConfigured? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.Medium,
    details: details
  }
}

//
// Checks if Azure Policy is enabled on Cluster
//
export function checkForAzurePolicy(clusterDetails) {

  console.log(chalk.white("Checking for Azure Policy on cluster..."));

  let details = [];

  // Check if Azure policy is enabled
  var azurePolicy = clusterDetails.addonProfiles?.azurepolicy;
  var azurePolicyConfigured = azurePolicy && azurePolicy.enabled;

  // Log output
  if (!azurePolicyConfigured) {
    details.push({
      status:  ResultStatus.Fail,
      message: "Azure Policy is not enabled"}
      );
  } else {
    details.push({
      status:  ResultStatus.Pass,
      message: "Azure Policy is enabled"}
      );
  }

  return {
    checkId: 'CSP-9',
    status: azurePolicyConfigured? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.Medium,
    details: details
  }
}

//
// Checks if the cluster has Azure Active Directory RBAC enabled
//
export function checkForAadRBAC(clusterDetails) {

  console.log(chalk.white("Checking for Azure Active Directory RBAC..."));

  let details = [];

  // Check if aad RBAC is configured
  var aadRBACConfigured = clusterDetails.aadProfile && clusterDetails.aadProfile.managed && clusterDetails.aadProfile.enableAzureRbac;

  // Log output
  if (!aadRBACConfigured) {
    details.push({
      status:  ResultStatus.Fail,
      message: "Azure Active Directory RBAC is not configured"}
      );
  }
  else {
    details.push({
      status:  ResultStatus.Pass,
      message: "Azure Active Directory RBAC is configured"}
      );
  }

  return {
    checkId: 'CSP-10',
    status: aadRBACConfigured? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.High,
    details: details
  }
}
