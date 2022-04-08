//
// Imports
//
import { spawn } from 'child_process'
//
// Quick function that wraps a promise with a timeout
//
const timeout = (prom, time, error) =>
  Promise.race([prom, new Promise((_r, rej) => setTimeout(function () { rej(error) }, time))]);

//
// Wrapper for executing a command on the system
//
export function executeCommand(command, timeoutInMs) {
  var commandPromise = new Promise((done, reject) => {
    var commandArray = command.split(' ');
    var justCommand = commandArray[0];
    var args = commandArray.slice(1);
    var child = spawn(justCommand, args);

    var stdout = "";
    var stderr = "";

    child.stdout.on('data', function (data) {
      stdout += data;
    });

    child.stderr.on('data', function (data) {
      stderr += data;
    });

    child.on('close', function (code) {
      if (code === 0) {
        done({
          stdout: stdout,
          stderr: stderr
        });
      } else {
        reject({
          stdout: stdout,
          stderr: stderr
        });
      }
    });
  });

  if (!timeoutInMs)
    return commandPromise;
  else
    return timeout(commandPromise, timeoutInMs, `Timed out waiting for '${command}' to finish executing`);
};

//
// Run a Kubernetes command with some CLI options
//
export async function getKubernetesJson(command, cliOptions) {

  // Build up a field selector string based on namespaces to ignore
  if (cliOptions && cliOptions.ignoreNamespaces) {

    var fields = '';
    var namespacesArr = cliOptions.ignoreNamespaces.split(',');

    // Build up fields for field selector
    for (const index in namespacesArr) {
      if (command.match(/get ns/i))
        fields += `metadata.name!=${namespacesArr[index]},`;
      else
        fields += `metadata.namespace!=${namespacesArr[index]},`;
    }

    // Remove trailing comma
    fields = fields.replace(/,\s*$/, "");

    // Construct field selector and inject into command
    var fieldSelector = `--field-selector ${fields}`;
    command = `${command} ${fieldSelector}`;
  }

  // Execute the command as json
  command = `${command} -o json`;
  var results = await executeCommand(command);

  // Parse results and return
  return JSON.parse(results.stdout);
}

//
// Check that a Kubernetes resource exists since `api-resources -o json` does not exist.
//
export async function doesResourceExist(resourceName) {
  
  try {
    var result = await executeCommand(`kubectl api-resources | awk -F ' ' '{ print $1 }' | grep '${resourceName}'`);

    return result.stdout? true: false;
  }
  catch {
    return false;
  }
}

