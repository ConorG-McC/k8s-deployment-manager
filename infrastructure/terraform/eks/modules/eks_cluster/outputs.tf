output "region" {
  description = "AWS region"
  value       = var.region
}

output "cluster" {
  description = "Kubernetes Cluster"
  value       = aws_eks_cluster.eks_cluster
}

output "cluster_name" {
  description = "Kubernetes Cluster Name"
  value       = aws_eks_cluster.eks_cluster.name
}

output "endpoint" {
  value = aws_eks_cluster.eks_cluster.endpoint
}

output "cluster_id" {
  description = "Id of the EKS cluster."
  value       = aws_eks_cluster.eks_cluster.id
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster OIDC Issuer"
  value       = try(aws_eks_cluster.eks_cluster.identity[0].oidc[0].issuer, null)
}

output "cluster_endpoint" {
  description = "The endpoint for your EKS Kubernetes API."
  value       = try(aws_eks_cluster.eks_cluster.endpoint, null)
}

output "cluster_certificate_authority_data" {
  description = "Nested attribute containing certificate-authority-data for your cluster. This is the base64 encoded certificate data required to communicate with your cluster."
  value       = try(aws_eks_cluster.eks_cluster.certificate_authority[0].data, null)
}

output "node_group" {
  description = "Node group of cluser"
  value       = aws_eks_node_group.eks_poc_node_group
}
