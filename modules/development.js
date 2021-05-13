import chalk from "chalk"
import { ResultStatus } from '../helpers/commandStatus.js';
import { Severity } from '../helpers/commandSeverity.js';

//
// Checks for any pods without liveness probes
//
export function checkForLivenessProbes(pods) {

  console.log(chalk.white("Checking for liveness probes..."));

  // Find all the pods without liveness probes
  var podsWithoutLivenessProbes = pods
    .items
    .filter(x => x.spec.containers.some(y => !y.livenessProbe))
    .map(x => x.metadata.name);

  // Log output
  if (podsWithoutLivenessProbes.length) {
    console.log(chalk.red(`--- Found ${podsWithoutLivenessProbes.length} pods without liveness probes`));
  } else {
    console.log(chalk.green('--- All pods have liveness probes'));
  }

  return {
    checkId: 'DEV-1',
    status: !podsWithoutLivenessProbes.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.Medium
  }
}

//
// Checks for any pods without readiness probes
//
export function checkForReadinessProbes(pods) {

  console.log(chalk.white("Checking for readiness probes..."));

  // Find all the pods without readiness probes
  var podsWithoutReadinessProbes = pods
    .items
    .filter(x => x.spec.containers.some(y => !y.readinessProbe))
    .map(x => x.metadata.name);

  // Log output
  if (podsWithoutReadinessProbes.length) {
    console.log(chalk.red(`--- Found ${podsWithoutReadinessProbes.length} pods without readiness probes`));
  } else {
    console.log(chalk.green('--- All pods have readiness probes'));
  }

  return {
    checkId: 'DEV-2',
    status: !podsWithoutReadinessProbes.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.Medium
  }
}

//
// Checks for any pods without startup probes
//
export function checkForStartupProbes(pods) {

  console.log(chalk.white("Checking for startup probes..."));

  // Find all the pods without startup probes
  var podsWithoutStartupProbes = pods
    .items
    .filter(x => x.spec.containers.some(y => !y.startupProbe))
    .map(x => x.metadata.name);

  // Log output
  if (podsWithoutStartupProbes.length) {
    console.log(chalk.red(`--- Found ${podsWithoutStartupProbes.length} pods without startup probes`));
  } else {
    console.log(chalk.green('--- All pods have startup probes'));
  }

  return {
    checkId: 'DEV-3',
    status: !podsWithoutStartupProbes.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.Medium
  }
}

//
// Checks for any pods without pre-stop hooks
//
export function checkForPreStopHooks(pods) {

  console.log(chalk.white("Checking for preStop hooks..."));

  // Find all the pods without preStop hooks
  var podsWithoutPreStopHooks = pods
    .items
    .filter(x => x.spec.containers.some(y => !y.lifecycle || !y.lifecycle.preStop))
    .map(x => x.metadata.name);

  // Log output
  if (podsWithoutPreStopHooks.length) {
    console.log(chalk.red(`--- Found ${podsWithoutPreStopHooks.length} pods without preStop hooks`));
  } else {
    console.log(chalk.green('--- All pods have preStop hooks'));
  }

  return {
    checkId: 'DEV-3',
    status: !podsWithoutPreStopHooks.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.Medium
  }
}

//
// Checks for any deployments with a single replica
//
export function checkForSingleReplicas(deployments) {

  console.log(chalk.white("Checking for single replica deployments..."));

  // Find all the deployments with a single replica
  var deploymentsWithOneReplica = deployments
    .items
    .filter(x => x.spec.replicas == 1)
    .map(x => x.metadata.name);

  // Log output
  if (deploymentsWithOneReplica.length) {
    console.log(chalk.red(`--- Found ${deploymentsWithOneReplica.length} deployments with a single replica`));
  } else {
    console.log(chalk.green('--- All deployments have more than one replica'));
  }

  return {
    checkId: 'DEV-4',
    status: !deploymentsWithOneReplica.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.High
  }
}

//
// Checks for any resources without labels or annotations
//
export function checkForTags(resources) {

  console.log(chalk.white("Checking for resources without labels or annotations..."));

  // Filter out the default namespace resource - this is usually never tagged
  var allResources = resources
    .flat()
    .filter(x => x.kind != "Namespace" || x.metadata.name != "default");

  // Find all the resources without any tags
  var resourcesWithoutTags = allResources
    .filter(x =>
      (!x.metadata.labels || Object.keys(x.metadata.labels).length == 0) &&
      (!x.metadata.annotations || Object.keys(x.metadata.annotations).length == 0))
    .map(x => x.metadata.name);

  // Log output
  if (resourcesWithoutTags.length) {
    console.log(chalk.red(`--- Found ${resourcesWithoutTags.length} resources without labels or annotations`));
  } else {
    console.log(chalk.green('--- All resources have labels or annotations'));
  }

  return {
    checkId: 'DEV-5',
    status: !resourcesWithoutTags.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.High
  }
}

//
// Checks for namespaces without any Horizontal Pod Autoscalers
//
export function checkForHorizontalPodAutoscalers(namespaces, autoScalers) {

  console.log(chalk.white("Checking for namespaces without Horizontal Pod Autoscalers..."));

  // Get all namespaces without any autoscalers
  var namespacesWithoutAutoscalers = namespaces
    .items
    .filter(x => x.metadata.name !== "default")
    .filter(x => !autoScalers.items.some(y => y.metadata.namespace == x.metadata.name))
    .map(x => x.metadata.name);

  // Log output
  if (namespacesWithoutAutoscalers.length) {
    console.log(chalk.red(`--- Found ${namespacesWithoutAutoscalers.length} namespaces without any Horizontal Pod Autoscalers`));
  } else {
    console.log(chalk.green('--- All namespaces contain Horizontal Pod Autoscalers'));
  }

  return {
    checkId: 'DEV-6',
    status: !namespacesWithoutAutoscalers.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.Low
  }
}

//
// Checks for the existence of an azure secrets store provider pod in the cluster
//
export function checkForAzureSecretsStoreProvider(pods) {

  console.log(chalk.white("Checking for Azure secrets store provider..."));

  // Grab all the containers for all the pods
  var containerImages = pods
    .items
    .map(x => x.spec.containers)
    .flat()
    .map(x => x.image);

  // Determine if any of the images are the secrets store provider
  var secretsStoreProviderExists = containerImages.some(x => x.match(/secrets-store\/provider-azure/i));

  // Log output
  if (!secretsStoreProviderExists) {
    console.log(chalk.red('--- Azure Secrets Store Provider was not found in the cluster'));
  } else {
    console.log(chalk.green('--- Azure Secrets Store Provider is installed'));
  }

  return {
    checkId: 'DEV-7',
    status: secretsStoreProviderExists.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.Medium
  }
}

//
// Checks if Azure Managed Identity is configured for pods
//
export function checkForAzureManagedPodIdentity(clusterDetails) {

  console.log(chalk.white("Checking for Azure Managed Identity for pods..."));

  // Determine if managed identity for pods is enabled
  var podIdentityProfile = clusterDetails.podIdentityProfile;
  var managedPodIdentityEnabled = podIdentityProfile && podIdentityProfile.enabled;

  // Log output
  if (!managedPodIdentityEnabled) {
    console.log(chalk.red('--- Azure Managed Identity for pods is not enabled'));
  } else {
    console.log(chalk.green('--- Azure Managed Identity for pods is enabled'));
  }

  return {
    checkId: 'DEV-8',
    status: managedPodIdentityEnabled.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.Medium
  }
}

//
// Checks if any pods are running in the default namespace
//
export function checkForPodsInDefaultNamespace(pods) {

  console.log(chalk.white("Checking for pods in default namespace..."));

  // Grab the pods running in the default namespace
  var podsInDefaultNamespace = pods
    .items
    .filter(x => x.metadata.namespace == "default");

  // Log output
  if (podsInDefaultNamespace.length) {
    console.log(chalk.red(`--- Found ${podsInDefaultNamespace.length} pods running in the default namespace`));
  } else {
    console.log(chalk.green('--- No pods running in default namespace'));
  }

  return {
    checkId: 'DEV-9',
    status: !podsInDefaultNamespace.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.High
  }
}

//
// Checks if any pods do not have requests or limits defined
//
export function checkForPodsWithoutRequestsOrLimits(pods) {

  console.log(chalk.white("Checking for pods without resource requests/limits..."));

  // Grab the pods with no requests or limits defined
  var podsWithNoRequestsOrLimits = pods
    .items
    .filter(x => x.spec.containers.some(y => !y.resources.limits || !y.resources.requests))
    .map(x => x.metadata.name);

  // Log output
  if (podsWithNoRequestsOrLimits.length) {
    console.log(chalk.red(`--- Found ${podsWithNoRequestsOrLimits.length} pods without either resource requests or limits`));
  } else {
    console.log(chalk.green('--- All pods have resource requests and limits'));
  }

  return {
    checkId: 'DEV-10',
    status: !podsWithNoRequestsOrLimits.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.High
  }
}

//
// Checks if any pods do not have requests or limits defined
//
export function checkForPodsWithDefaultSecurityContext(pods) {

  console.log(chalk.white("Checking for pods with default security context..."));

  // Grab the pods with no requests or limits defined
  var podsWithDefaultSecurityContext = pods
    .items
    .filter(x =>
      Object.keys(x.spec.securityContext).length == 0 &&
      x.spec.containers.some(y => !y.securityContext || Object.keys(y.securityContext).length == 0))
    .map(x => x.metadata.name);

  // Log output
  if (podsWithDefaultSecurityContext.length) {
    console.log(chalk.red(`--- Found ${podsWithDefaultSecurityContext.length} pods using the default security context`));
  } else {
    console.log(chalk.green('--- All pods have their security context specified'));
  }

  return {
    checkId: 'DEV-11',
    status: !podsWithDefaultSecurityContext.length? ResultStatus.Pass: ResultStatus.Fail,
    severity: Severity.High
  }
}