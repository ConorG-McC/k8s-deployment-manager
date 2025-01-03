resource "aws_eks_cluster" "eks_cluster" {
  name    = "${var.cluster_name}-${var.branch_name}"
  version = var.cluster_version
  vpc_config {
    subnet_ids              = var.private_subnets
    endpoint_private_access = var.endpoint_private_access
    endpoint_public_access  = var.endpoint_public_access
    public_access_cidrs = var.public_access_cidrs
  }
  role_arn = aws_iam_role.masters_role.arn
  # Ensure that IAM Role permissions are created before and deleted after EKS Cluster handling.
  # Otherwise, EKS will not be able to properly delete EKS managed EC2 infrastructure such as Security Groups.
  depends_on = [
    aws_iam_role.masters_role
  ]
}
