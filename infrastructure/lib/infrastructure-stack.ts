import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EKSConstruct } from './eks-construct';
import { LambdaConstruct } from './lambda-construct';
import { APIGatewayConstruct } from './apigateway-construct';
import * as iam from 'aws-cdk-lib/aws-iam';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Initialize EKS Construct
    const eksConstruct = new EKSConstruct(this, 'EKSConstruct');

    // Initialize Lambda Construct with reference to EKS
    const lambdaConstruct = new LambdaConstruct(this, 'LambdaConstruct', {
      cluster: eksConstruct.cluster,
      vpc: eksConstruct.vpc,
    });

    // Initialize API Gateway Construct with Lambda functions
    const apiGatewayConstruct = new APIGatewayConstruct(
      this,
      'APIGatewayConstruct',
      {
        deployAppFunction: lambdaConstruct.deployAppFunction,
        connectFunction: lambdaConstruct.connectFunction,
        disconnectFunction: lambdaConstruct.disconnectFunction,
      }
    );

    // Update DeployAppFunction with WEBSOCKET_API_ENDPOINT
    lambdaConstruct.deployAppFunction.addEnvironment(
      'WEBSOCKET_API_ENDPOINT',
      apiGatewayConstruct.websocketApi.apiEndpoint +
        '/' +
        apiGatewayConstruct.websocketStage.stageName
    );

    // Grant API Gateway permissions to manage connections
    const websocketApiArn =
      apiGatewayConstruct.websocketApi.arnForExecuteApi('*');
    lambdaConstruct.deployAppFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['execute-api:ManageConnections'],
        resources: [websocketApiArn],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'RESTAPIEndpoint', {
      value: apiGatewayConstruct.restApi.url,
    });

    new cdk.CfnOutput(this, 'WebSocketAPIEndpoint', {
      value: apiGatewayConstruct.websocketStage.url,
    });
  }
}
