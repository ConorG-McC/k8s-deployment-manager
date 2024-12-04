variable "cluster_name" {
  type        = string
  description = "Cluster name"
}

variable "branch_name" {
  description = "Name of the Git branch being deployed"
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes minor version to use for the EKS cluster (for example 1.21)"
  type        = string
}

variable "environment" {
  description = "Environment Variable used as a prefix"
  type        = string
}

variable "endpoint_private_access" {
  description = "Private endpoint access Variable"
  type        = bool
}

variable "endpoint_public_access" {
  description = "Public endpoint access variable"
  type        = bool
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "vpc" {
  type        = string
  description = "VPC"
}

variable "private_subnets" {
  description = "List of private subnet IDs for the EKS cluster"
  type        = list(string)
}

// Nodegroup variables
variable "ami_type" {
  description = "AMI type for the cluster"
  type        = string
}

variable "capacity_type" {
  description = "The capacity type of the compute"
  type        = string
}
variable "disk_size" {
  description = "Disk size"
  type        = number
}
variable "instance_type" {
  description = "Instance trype of the compute"
  type        = list(any)
}

variable "desired_size" {
  description = "The desired size of the cluster i.e. desired number of nodes running always"
  type        = number
}

variable "min_size" {
  description = "Minimum number of nodes running for ASG to trigger"
  type        = number
}

variable "max_size" {
  description = "Maximum number of nodes running for ASG to trigger"
  type        = number
}

variable "max_unavailable" {
  description = "Maximum number of nodes unavailable during node group upgrade"
  type        = number
}

variable "nodegroup_tags" {
  type        = map(any)
  description = "Tags to be applied to Cluster node group"
}

locals {
  // Common variables
  environment         = lower(var.environment)
  environment_no_dash = replace(var.environment, "-", "_")
  cluster_name        = var.cluster_name
  cluster_version     = var.cluster_version
  region              = var.region
  subnet_ids          = var.private_subnets
  max_unavailable     = var.max_unavailable
  private_subnets     = var.private_subnets
  // Node group local variables 
  ami_type       = var.ami_type
  capacity_type  = var.capacity_type
  disk_size      = var.disk_size
  instance_type  = var.instance_type
  desired_size   = var.desired_size
  min_size       = var.min_size
  max_size       = var.max_size
  nodegroup_tags = var.nodegroup_tags
  common_tags = {
    Application = "ESN PoC"
    Project     = "EKS Build"
    Environment = local.environment
  }
}
