terraform {
  backend "s3" {
    bucket         = "k8s-deployment-manager-tfstate"
    region         = "eu-west-2"
    encrypt        = true
    key            = "k8s-deployment-manager/terraform.tfstate"
    dynamodb_table = "k8s_deployment_manager_lockid"
  }
}
