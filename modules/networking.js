import chalk from "chalk"
import { ResultStatus } from '../helpers/commandStatus.js';
import { Severity } from '../helpers/commandSeverity.js';
import { EOL } from 'os';

const space = '            '

//
// Checks for network policies
//
export function checkForNetworkPolicies(networkPolicies) {

  console.log(chalk.white("Checking for networking policies..."));

  let details = []

  // Log output
  if (networkPolicies.items.length) {

    let message = `Found ${networkPolicies.items.length} network policies`;

    // Print out network policies for verbose logging
    if (global.verbose) {
      networkPolicies.items.forEach(x => message += `${EOL}${space}${x.metadata.namespace}/${x.metadata.name}`);
    }

    details.push({
      status: ResultStatus.Pass,
      message: message
    });
  } else {
    details.push({
      status: ResultStatus.Fail,
      message: 'No network policies were found'
    });
  }

  return {
    checkId: 'NET-6',
    status: details[0].status,
    severity: Severity.Medium,
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
        status:  ResultStatus.Pass,
        message: `${serviceMeshName} was found`}
        );
    }
    
  }

  return {
    checkId: 'NET-9',
    status: ResultStatus.Fail,
    severity: Severity.Informational,
    details: details
  }
}