// Configuration to drive EKS Cluster and Node Group creation 
cluster_name = "k8s-deployment-manager-eks-tf"
cluster_version = "1.31"
branch_name = "infra-tf"
environment = "dev"
endpoint_private_access = true
endpoint_public_access = true
region = "eu-west-2"
account_id = "AWS_PROFILE"
// Node Group Variable values
ami_type = "AL2_x86_64"
capacity_type = "ON_DEMAND"
disk_size = 20
instance_type = ["t3.micro"]
desired_size = 1
min_size = 1
max_size = 2
max_unavailable = 1
public_access_cidrs = ["86.156.107.219/32"]
nodegroup_tags = {
    Name        = "ManagedNodeGroup"
    Type: "Managed-Node-Group",
    LaunchTemplate: "Custom",
    Instance: "ONDEMAND"
}
