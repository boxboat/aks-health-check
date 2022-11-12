package test

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/google/martian/v3/log"
	"github.com/gruntwork-io/terratest/modules/docker"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"

	test_structure "github.com/gruntwork-io/terratest/modules/test-structure"
)

// An example of how to test the simple Terraform module in examples/terraform-basic-example using Terratest.
func TestSimpleCluster(t *testing.T) {
	t.Parallel()

	tempFolder := test_structure.CopyTerraformFolderToTemp(t, ".", "scenario/simple-cluster")

	test_structure.RunTestStage(t, "arrange", func() {
		terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
			// The path to where our Terraform code is located
			TerraformDir: "scenario/simple-cluster",

			// Disable colors in Terraform commands so its easier to parse stdout/stderr
			NoColor: true,
		})
		test_structure.SaveTerraformOptions(t, tempFolder, terraformOptions)

		// This will run `terraform init` and `terraform apply` and fail the test if there are any errors
		terraform.InitAndApply(t, terraformOptions)

		WriteKubeConfigFile(tempFolder, terraform.Output(t, terraformOptions, "kube_config"))
	})

	test_structure.RunTestStage(t, "act", func() {

		tag := "boxboat/aks-health-check:terragrunt"
		buildOptions := &docker.BuildOptions{
			Tags: []string{tag},
		}
		docker.Build(t, "..", buildOptions)

		kubeconfigpath := tempFolder + "/kubeconfig"
		absoluateKubeConfig, err := filepath.Abs(kubeconfigpath)
		if err != nil {
			log.Errorf("Unable to get absolute path for kubeconfig: %v", err)
		}
		opts := &docker.RunOptions{
			Volumes: []string{
				absoluateKubeConfig + ":/home/boxboat/.kube/config",
			},
			Command: []string{"aks-hc", "check", "kubernetes"},
		}
		log.Infof("Running docker image with temp folder %s", tempFolder)
		output := docker.Run(t, tag, opts)

		test_structure.SaveString(t, tempFolder, "output", output)
	})

	test_structure.RunTestStage(t, "assert", func() {
		output := test_structure.LoadString(t, tempFolder, "output")
		assert.Contains(t, output, "DEV-1")
	})

	defer test_structure.RunTestStage(t, "teardown", func() {
		terraformOptions := test_structure.LoadTerraformOptions(t, tempFolder)
		terraform.Destroy(t, terraformOptions)
	})
}

func WriteKubeConfigFile(tempFolder string, kubeconfig string) {
	err := os.WriteFile(tempFolder+"/kubeconfig", []byte(kubeconfig), 0755)
	if err != nil {
		fmt.Printf("Unable to write file: %v", err)
	}
}
