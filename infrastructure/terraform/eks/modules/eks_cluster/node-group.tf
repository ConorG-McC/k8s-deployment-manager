resource "aws_eks_node_group" "eks_poc_node_group" {
  cluster_name    = aws_eks_cluster.eks_cluster.name
  node_group_name = "ManagedNodeGroup"
  node_role_arn   = aws_iam_role.eks_poc_node_group_iam_role.arn
  subnet_ids      = var.private_subnets

  ami_type       = var.ami_type
  capacity_type  = var.capacity_type
  disk_size      = var.disk_size
  instance_types = var.instance_type

  scaling_config {
    desired_size = var.desired_size
    max_size     = var.max_size
    min_size     = var.min_size
  }

  # Desired max percentage of unavailable worker nodes during node group update.
  update_config {
    max_unavailable = 1
  }

  # Ensure that IAM Role permissions are created before and deleted after EKS Node Group handling.
  # Otherwise, EKS will not be able to properly delete EC2 Instances and Elastic Network Interfaces.
  depends_on = [
    aws_iam_role_policy_attachment.eks_poc_ng_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.eks_poc_ng_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.eks_poc_ng_AmazonEC2ContainerRegistryReadOnly,
  ]
}

resource "aws_iam_role" "eks_poc_node_group_iam_role" {
  name                 = "${local.cluster_name}-${var.branch_name}_node_group_iam_role"
  permissions_boundary = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/DcpPermissionsBoundary"

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })
}

resource "aws_iam_role_policy_attachment" "eks_poc_ng_AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_poc_node_group_iam_role.name
}

resource "aws_iam_role_policy_attachment" "eks_poc_ng_AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_poc_node_group_iam_role.name
}

resource "aws_iam_role_policy_attachment" "eks_poc_ng_AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_poc_node_group_iam_role.name
}
