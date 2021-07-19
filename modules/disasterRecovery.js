import chalk from "chalk"
import { equalsIgnoreCase } from '../helpers/stringCompare.js';
import { ResultStatus } from '../helpers/commandStatus.js';
import { Severity } from '../helpers/commandSeverity.js';
import { EOL } from 'os';

const space = '            '

//
// Checks if the cluster has agent pools without multiple availability zones
//
export function checkForAvailabilityZones(clusterDetails) {

  console.log(chalk.white("Checking for agent pools without multiple availability zones..."));

  let details = []

  // Find agent pools with either no AZ's or a single AZ
  var agentPoolsWithNoAzs = clusterDetails
    .agentPoolProfiles
    .filter(x => (x.availabilityZones || []).length <= 1);

  // Log output
  if (agentPoolsWithNoAzs.length) {
    let message = `Found ${agentPoolsWithNoAzs.length} agent pools without multiple availability zones`;

    if (global.verbose) {
      agentPoolsWithNoAzs.forEach(x => message += `${EOL}${space}${x.name}`);
    }

    details.push({
      status: ResultStatus.Fail,
      message: message
    }
    );
  } else {
    details.push({
      status: ResultStatus.Pass,
      message: 'All agent pools have multiple availability zones'
    }
    );
  }

  return {
    checkId: 'DR-2',
    status: !agentPoolsWithNoAzs.length ? ResultStatus.Pass : ResultStatus.Fail,
    severity: Severity.High,
    details: details
  }
}

//
// Checks if Velero is installed in the cluster
//
export function checkForVelero(pods) {

  console.log(chalk.white("Checking for Velero..."));

  let details = []

  // Check if Velero is installed
  var veleroInstalled = pods
    .items
    .some(pod => pod.spec.containers.some(con => equalsIgnoreCase(con.name, "velero")));

  // Log output
  if (!veleroInstalled) {
    details.push({
      status: ResultStatus.Fail,
      message: "Velero is not installed"
    }
    );
  } else {
    details.push({
      status: ResultStatus.Pass,
      message: "Velero is installed"
    }
    );
  }

  return {
    checkId: 'DR-5',
    status: veleroInstalled.length ? ResultStatus.Pass : ResultStatus.Fail,
    severity: Severity.Medium,
    details: details
  }
}

//
// Checks if the control plane is configured for an SLA
//
export function checkForControlPlaneSla(clusterDetails) {

  console.log(chalk.white("Checking for SLA for control plane..."));

  let details = []

  // Check if SLA is configured for the management plane
  var slaConfigured = clusterDetails.sku.tier == "Paid";

  // Log output
  if (!slaConfigured) {
    details.push({
      status: ResultStatus.Fail,
      message: "An SLA has not been configured for the control plane"
    }
    );
  } else {
    details.push({
      status: ResultStatus.Pass,
      message: "An SLA has been configured for the control plane"
    }
    );
  }

  return {
    checkId: 'DR-6',
    status: slaConfigured.length ? ResultStatus.Pass : ResultStatus.Fail,
    severity: Severity.High,
    details: details
  }
}