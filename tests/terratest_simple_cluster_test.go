package test

import (
	"fmt"
	"os"
	"testing"

	"github.com/gruntwork-io/terratest/modules/docker"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"gotest.tools/v3/assert"

	test_structure "github.com/gruntwork-io/terratest/modules/test-structure"
)

// An example of how to test the simple Terraform module in examples/terraform-basic-example using Terratest.
func TestSimpleCluster(t *testing.T) {
	t.Parallel()

	tempFolder := test_structure.CopyTerraformFolderToTemp(t, "../", "test-runs/simple-cluster")

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

		opts := &docker.RunOptions{
			Volumes: []string{
				tempFolder + "/kubeconfig:/home/boxboat/.kube/config",
			},
			Command: []string{"aks-hc", "check", "kubernetes"},
		}
		output := docker.Run(t, tag, opts)

		test_structure.SaveString(t, tempFolder, "output", output)
	})

	test_structure.RunTestStage(t, "assert", func() {
		output := test_structure.LoadString(t, tempFolder, "output")
		assert.Equal(t, "Hello, World!", output)
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
