import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class EKSConstruct extends Construct {
  public readonly cluster: eks.Cluster;
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create VPC
    this.vpc = new ec2.Vpc(this, 'DeploymentVPC', {
      maxAzs: 3, // Adjust as needed
    });

    // Create EKS Cluster
    this.cluster = new eks.Cluster(this, 'DeploymentEKSCluster', {
      vpc: this.vpc,
      defaultCapacity: 0, // We'll add managed node groups
      version: eks.KubernetesVersion.V1_21,
    });

    // Add Managed Node Group
    this.cluster.addNodegroupCapacity('ExtraCapacityGroup', {
      desiredSize: 2,
      instanceTypes: [new ec2.InstanceType('t3.medium')],
    });
  }
}
