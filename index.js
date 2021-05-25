#!/usr/bin/env node

//
// Imports
//
import { executeCommand, getKubernetesJson, doesResourceExist } from './helpers/commandHelpers.js'
import { Command } from "commander"
import chalk from "chalk"
import * as Development from './modules/development.js';
import * as ImageManagement from './modules/imageManagement.js';
import * as ClusterSetup from './modules/clusterSetup.js';
import * as DisasterRecovery from './modules/disasterRecovery.js';
import { equalsIgnoreCase } from './helpers/stringCompare.js';
import * as CheckDefinitions from './checks-definition.js';

//
// Sort the results from checks by the Check ID. Then show a table.
//
function showTableFromResults(results) {
  let sortedResults = results.sort((a,b) => a.checkId > b.checkId? 1: -1);
  const transformed = sortedResults.reduce((re, { checkId, ...x }) => { re[checkId] = x; return re }, {})
  console.table(transformed);

  
}

async function checkAzure(options) {
  await executeCommand("az");

  setupGlobals(options);

  if (options.dryRun === undefined); // No dry run
  else if (options.dryRun === true) console.log('Dry run coming soon. (mode: fail)');
  else console.log(`Dry run coming soon. (mode: ${options.dryRun})`);

  // Parse container registries
  var registriesArr = options.imageRegistries ? options.imageRegistries.split(',') : [];

  // Begin pulling data
  console.log(chalk.bgWhite(chalk.black('               Downloading Infrastructure Data               ')));

  // Get cluster details
  console.log(chalk.blue("Fetching cluster information..."));
  var commandResults = await executeCommand(`az aks show -g ${options.resourceGroup} -n ${options.name}`);
  var clusterDetails = JSON.parse(commandResults.stdout);

  // Get container registries
  var containerRegistries = [];
  if (registriesArr.length) {
    console.log(chalk.blue("Fetching Azure Container Registry information..."));
    var commandResults = await executeCommand(`az acr list`);
    containerRegistries = JSON.parse(commandResults.stdout);
    containerRegistries = containerRegistries.filter(x => registriesArr.some(y => equalsIgnoreCase(y, x.name)));
  }

  let results = [];

  // Check development items
  console.log();
  console.log(chalk.bgWhite(chalk.black('               Scanning Development Items               ')));

  Development.checkForAzureManagedPodIdentity(clusterDetails);

  // Check cluster setup items
  console.log();
  console.log(chalk.bgWhite(chalk.black('               Scanning Cluster Setup Items               ')));
  results.push(ClusterSetup.checkForAuthorizedIpRanges(clusterDetails));
  results.push(ClusterSetup.checkForManagedAadIntegration(clusterDetails));
  results.push(ClusterSetup.checkForAutoscale(clusterDetails));
  results.push(ClusterSetup.checkForMultipleNodePools(clusterDetails));

  console.log();
  console.log(chalk.bgWhite(chalk.black('               Scanning Disaster Recovery Items               ')));
  results.push(DisasterRecovery.checkForAvailabilityZones(clusterDetails));
  results.push(DisasterRecovery.checkForControlPlaneSla(clusterDetails));

  // Check image management items
  console.log();
  console.log(chalk.bgWhite(chalk.black('               Scanning Image Management Items               ')));
  results.push(ImageManagement.checkForPrivateEndpointsOnRegistries(containerRegistries));
  results.push(await ImageManagement.checkForAksAcrRbacIntegration(clusterDetails, containerRegistries));

  return results;
}

async function checkKubernetes(options) {
  await executeCommand("kubectl");

  setupGlobals(options);

  if (options.dryRun === undefined); // No dry run
  else if (options.dryRun === true) console.log('Dry run coming soon. (mode: fail)');
  else console.log(`Dry run coming soon. (mode: ${options.dryRun})`);

  // Fetch all the namespaces
  console.log(chalk.blue("Fetching all namespaces..."));
  var namespaces = await getKubernetesJson('kubectl get ns', options);

  // Fetch all the pods
  console.log(chalk.blue("Fetching all pods..."));
  var pods = await getKubernetesJson('kubectl get pods --all-namespaces', options);

  // Fetch all the deployments
  console.log(chalk.blue("Fetching all deployments..."));
  var deployments = await getKubernetesJson('kubectl get deployments --all-namespaces', options);

  // Fetch all the services
  console.log(chalk.blue("Fetching all services..."));
  var services = await getKubernetesJson('kubectl get svc --all-namespaces', options);

  // Fetch all the config maps
  console.log(chalk.blue("Fetching all config maps..."));
  var configMaps = await getKubernetesJson('kubectl get configmap --all-namespaces', options);

  // Fetch all the secrets
  console.log(chalk.blue("Fetching all secrets..."));
  var secrets = await getKubernetesJson('kubectl get secret --all-namespaces', options);

  // Fetch all the horizontal pod autoscalers
  console.log(chalk.blue("Fetching all Horizontal Pod AutoScalers..."));
  var autoScalers = await getKubernetesJson('kubectl get hpa --all-namespaces', options);

  var hasConstraintTemplates = await doesResourceExist("constrainttemplates");
  var constraintTemplates = null;
  if (hasConstraintTemplates) {
    // Fetch all the constraint templates (Open Policy Agent)
    console.log(chalk.blue("Fetching all Constraint Templates..."));
    constraintTemplates = await getKubernetesJson('kubectl get constrainttemplate');
  }

  let results = [];

  // Check development items
  console.log();
  console.log(chalk.bgWhite(chalk.black('               Scanning Development Items               ')));
  results.push(Development.checkForLivenessProbes(pods));
  results.push(Development.checkForReadinessProbes(pods));
  results.push(Development.checkForStartupProbes(pods));
  results.push(Development.checkForPreStopHooks(pods));
  results.push(Development.checkForSingleReplicas(deployments));
  results.push(Development.checkForTags([namespaces.items, pods.items, deployments.items, services.items, configMaps.items, secrets.items]));
  results.push(Development.checkForHorizontalPodAutoscalers(namespaces, autoScalers));
  results.push(Development.checkForAzureSecretsStoreProvider(pods));

  results.push(Development.checkForPodsInDefaultNamespace(pods));
  results.push(Development.checkForPodsWithoutRequestsOrLimits(pods));
  results.push(Development.checkForPodsWithDefaultSecurityContext(pods));

  // Check image management items
  console.log();
  console.log(chalk.bgWhite(chalk.black('               Scanning Image Management Items               ')));
  if (hasConstraintTemplates) {
    results.push(ImageManagement.checkForAllowedImages(constraintTemplates));
    results.push(ImageManagement.checkForNoPrivilegedContainers(constraintTemplates));
  }
  results.push(ImageManagement.checkForRuntimeContainerSecurity(pods));

  // Check cluster setup items
  console.log();
  console.log(chalk.bgWhite(chalk.black('               Scanning Cluster Setup Items               ')));
  results.push(ClusterSetup.checkForKubernetesDashboard(pods));
  results.push(ClusterSetup.checkForServiceMesh(deployments, pods));

  // Check disaster recovery items
  console.log();
  console.log(chalk.bgWhite(chalk.black('               Scanning Disaster Recovery Items               ')));
  results.push(DisasterRecovery.checkForVelero(pods));

  return results;
}

//
// Setup globals
//
function setupGlobals(options) {
  global.verbose = options.verbose ? true : false;
}

//
// Main function
//
async function main(options) {
  var results = await checkAzure(options);  
  return results.concat(await checkKubernetes(options));
}

// Build up the program
const program = new Command();
program
  .name('aks-hc')
  .description(`
  
                  .,,,,* ,,,,,                                  
                  .,,,,, ,,,,,                                                        
            ,,,,,..,,,,, ,,,,, ,,,,,                            
            ,,,,,..,,,,* ,,,,, ,,,,,                            
      ,,,,, ,,,,,..,,,,, ,,,,, ,,,,, ,,,,,,                     
      ,,,,, ,,,,,..,,,*(%(,,,, ,,,,, ,,,,,,                     
                  /((((((%%%%%%%,                                
      ,,,,,,((((((((((((%%%%%%%%%%%%#*,,,,,                     
      .((((((((((((((((((%%%%%%%%%%%%%%%%%%/                     
  ((((((((((((((((((((((%%%%%%%%%%%%%%%%%%%%%%.                 
    #((((((((((((((((((((%%%%%%%%%%%%%%%%%%%%%,                  
     ((((((((((((((((((((%%%%%%%%%%%%%%%%%%%%                    
      ,((((((((((((((((((%%%%%%%%%%%%%%%%%%%                     
        (((((((((((((((((%%%%%%%%%%%%%%%%%#                      
        ((((((((((((((((%%%%%%%%%%%%%%%%(                       
          #(((((#((((((((%%%%%%%%%%%%%%%,                        
      ,,, /#, ,,, .##  ,,, /%# .,,. #%  ,,,   
  
  BoxBoat's AKS Health Check

  Check for best practices against an Azure Kubernetes Service (AKS) cluster.`
  );

const check = program.command('check', { isDefault: true });
check
  .command('azure')
  .requiredOption('-g, --resource-group <group>', 'Resource group of AKS cluster')
  .requiredOption('-n, --name <name>', 'Name of AKS cluster')
  .option('--dry-run [mode]', "Dry run with mode 'fail' or 'pass'. Defaults to 'fail'. Do not actually perform the checks, just observe results.")
  .option('-v, --verbose', 'Enable verbose console logging')
  .action(async (options) => {
    var results = await checkAzure(options);
    showTableFromResults(results);
  });

check
  .command('kubernetes')
  .option('-r, --image-registries <registries>', 'A comma-separated list of Azure Container Registry names used with the cluster')
  .option('--dry-run [mode]', "Dry run with mode 'fail' or 'pass'. Defaults to 'fail'. Do not actually perform the checks, just observe results.")
  .option('-i, --ignore-namespaces <namespaces>', 'A comma-separated list of namespaces to ignore when doing analysis')
  .option('-v, --verbose', 'Enable verbose console logging')
  .action(async (options) => {
    var results = await checkKubernetes(options);
    showTableFromResults(results);
  });

check
  .command('all', { isDefault: true })
  .requiredOption('-g, --resource-group <group>', 'Resource group of AKS cluster')
  .requiredOption('-n, --name <name>', 'Name of AKS cluster')
  .option('-r, --image-registries <registries>', 'A comma-separated list of Azure Container Registry names used with the cluster')
  .option('--dry-run [mode]', "Dry run with mode 'fail' or 'pass'. Defaults to 'fail'. Do not actually perform the checks, just observe results.")
  .option('-i, --ignore-namespaces <namespaces>', 'A comma-separated list of namespaces to ignore when doing analysis')
  .option('-v, --verbose', 'Enable verbose console logging')
  .action(async (options) => {
    var results = await main(options);
    showTableFromResults(results);
  });

// Parse command
program.parse(process.argv);
