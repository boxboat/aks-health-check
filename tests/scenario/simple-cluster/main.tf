resource "azurerm_resource_group" "rg" {
  name     = "rg-simple-cluster"
  location = "eastus"
}

resource "azurerm_kubernetes_cluster" "aks" {
  name                = "aks-simple-cluster"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = "aks-simple-cluster"

  default_node_pool {
    name       = "default"
    node_count = 1
    vm_size    = "Standard_B2s"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = "Integration Test"
  }
}