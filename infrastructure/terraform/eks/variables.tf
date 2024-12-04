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
