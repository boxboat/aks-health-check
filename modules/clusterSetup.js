import chalk from "chalk"

//
// Checks if the cluster master has authorized ip ranges set
//
export async function checkForAuthorizedIpRanges(clusterDetails) {

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