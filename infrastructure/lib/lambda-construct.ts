import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';

interface LambdaConstructProps {
  cluster: eks.Cluster;
  vpc: ec2.Vpc;
}

export class LambdaConstruct extends Construct {
  public readonly deployAppFunction: lambda.Function;
  public readonly connectFunction: lambda.Function;
  public readonly disconnectFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    // Reference the KubeConfig secret from Secrets Manager
    const kubeConfigSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'KubeConfigSecret',
      'EKS_KubeConfig'
    );

    // DeployAppFunction
    this.deployAppFunction = new lambda.Function(this, 'DeployAppFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'deploy.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/deploy')),
      environment: {
        CLUSTER_NAME: props.cluster.clusterName,
        EKS_KUBECONFIG_SECRET: kubeConfigSecret.secretName,
        WEBSOCKET_API_ENDPOINT: '', // To be set after API Gateway is initialized
      },
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [
        new ec2.SecurityGroup(this, 'DeployAppLambdaSG', { vpc: props.vpc }),
      ],
      timeout: cdk.Duration.seconds(300),
    });

    // Grant necessary permissions
    kubeConfigSecret.grantRead(this.deployAppFunction);
    this.deployAppFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'eks:DescribeCluster',
          'eks:ListClusters',
          'eks:ListNodegroups',
          'eks:DescribeNodegroup',
          'eks:CreateNodegroup',
          'eks:DeleteNodegroup',
        ],
        resources: ['*'], // Ideally, restrict to specific resources
      })
    );

    // Allow the function to call API Gateway Management API
    this.deployAppFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['execute-api:ManageConnections'],
        resources: ['arn:aws:execute-api:*:*:*'], // Ideally, restrict to specific API ARNs
      })
    );

    // ConnectFunction
    this.connectFunction = new lambda.Function(this, 'ConnectFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'connect.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/connect')),
      environment: {
        // Add environment variables if needed
      },
    });

    // DisconnectFunction
    this.disconnectFunction = new lambda.Function(this, 'DisconnectFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'disconnect.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/disconnect')),
      environment: {
        // Add environment variables if needed
      },
    });
  }
}
