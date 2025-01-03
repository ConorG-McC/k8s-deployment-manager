data "aws_ssm_parameter" "dcp_hybrid_vpc" {
  name = "/Conor-Dev/Networking/VpcID"
}

data "aws_ssm_parameter" "private_subnet_a" {
  name = "/Conor-Dev/Networking/PrivateSubnetAID"
}

data "aws_ssm_parameter" "private_subnet_b" {
  name = "/Conor-Dev/Networking/PrivateSubnetBID"
}

data "aws_ssm_parameter" "private_subnet_c" {
  name = "/Conor-Dev/Networking/PrivateSubnetCID"
}

locals {
  vpc = data.aws_ssm_parameter.dcp_hybrid_vpc.id
  private_subnets = [
    data.aws_ssm_parameter.private_subnet_a.value,
    data.aws_ssm_parameter.private_subnet_b.value,
    data.aws_ssm_parameter.private_subnet_c.value
  ]
}


module "eks_cluster" {
  cluster_name            = var.cluster_name
  branch_name             = var.branch_name
  vpc                     = local.vpc
  endpoint_private_access = var.endpoint_private_access
  endpoint_public_access  = var.endpoint_public_access
  source                  = "./modules/eks_cluster"
  region                  = var.region
  account_id              = var.account_id
  ami_type                = var.ami_type
  disk_size               = var.disk_size
  capacity_type           = var.capacity_type
  instance_type           = var.instance_type
  cluster_version         = var.cluster_version
  environment             = var.environment
  max_size                = var.max_size
  min_size                = var.min_size
  desired_size            = var.desired_size
  max_unavailable         = var.max_unavailable
  nodegroup_tags = {
    Name        = var.cluster_name
    Environment = var.environment
    Platform    = "dev"
  }
  private_subnets      = local.private_subnets
  public_access_cidrs  = var.public_access_cidrs
}
