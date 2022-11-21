output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "name" {
  value = azurerm_kubernetes_cluster.aks.name
}

output "location" {
  value = azurerm_kubernetes_cluster.aks.location
}

output "kube_config" {
  value = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive = true
}