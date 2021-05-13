import chalk from "chalk"
import { equalsIgnoreCase } from '../helpers/stringCompare.js';
import { ResultStatus } from '../helpers/commandStatus.js';
import { Severity } from '../helpers/commandSeverity.js';

//
// Checks if the cluster has agent pools without multiple availability zones
//
export function checkForAvailabilityZones(clusterDetails) {

  console.log(chalk.white("Checking for agent pools without multiple availability zones..."));

  // Find agent pools with either no AZ's or a single AZ
  var agentPoolsWithNoAzs = clusterDetails
    .agentPoolProfiles
    .filter(x => (x.availabilityZones || []).length <= 1);

  // Log output
  if (agentPoolsWithNoAzs.length) {
    console.log(chalk.red(`--- Found ${agentPoolsWithNoAzs.length} agent pools without multiple availability zones`));
  } else {
    console.log(chalk.green("--- All agent pools have multiple availability zones"));
  }

  return {
    checkId: 'DR-1',
    status: !agentPoolsWithNoAzs.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.High
  }
}

//
// Checks if the control plane is configured for an SLA
//
export function checkForControlPlaneSla(clusterDetails) {

  console.log(chalk.white("Checking for SLA for control plane..."));

  // Check if SLA is configured for the management plane
  var slaConfigured = clusterDetails.sku.tier == "Paid";

  // Log output
  if (!slaConfigured) {
    console.log(chalk.red(`--- An SLA has not been configured for the control plane`));
  } else {
    console.log(chalk.green("--- An SLA has been configured for the control plane"));
  }

  return {
    checkId: 'DR-2',
    status: slaConfigured.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.High
  }
}

//
// Checks if Velero is installed in the cluster
//
export function checkForVelero(pods) {

  console.log(chalk.white("Checking for Velero..."));

  // Check if Velero is installed
  var veleroInstalled = pods
    .items
    .some(pod => pod.spec.containers.some(con => equalsIgnoreCase(con.name, "velero")));

  // Log output
  if (!veleroInstalled) {
    console.log(chalk.red(`--- Velero is not installed`));
  } else {
    console.log(chalk.green("--- Velero is installed"));
  }

  return {
    checkId: 'DR-3',
    status: veleroInstalled.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.Medium
  }
}