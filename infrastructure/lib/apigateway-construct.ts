import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface APIGatewayConstructProps {
  deployAppFunction: lambda.IFunction;
  connectFunction: lambda.IFunction;
  disconnectFunction: lambda.IFunction;
}

export class APIGatewayConstruct extends Construct {
  public readonly restApi: apigateway.RestApi;
  public readonly websocketApi: apigatewayv2.WebSocketApi;
  public readonly websocketStage: apigatewayv2.WebSocketStage;

  constructor(scope: Construct, id: string, props: APIGatewayConstructProps) {
    super(scope, id);

    // REST API for Deployment Requests
    this.restApi = new apigateway.RestApi(this, 'DeploymentRESTAPI', {
      restApiName: 'Deployment Service',
      description: 'Handles deployment requests.',
      deployOptions: {
        stageName: 'prod',
      },
    });

    const deployResource = this.restApi.root.addResource('deploy');
    deployResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(props.deployAppFunction, {
        proxy: true,
      })
    );

    // WebSocket API for Status Updates
    this.websocketApi = new apigatewayv2.WebSocketApi(
      this,
      'DeploymentStatusWebSocketAPI',
      {
        connectRouteOptions: {
          integration: new WebSocketLambdaIntegration(
            'ConnectIntegration',
            props.connectFunction
          ),
        },
        disconnectRouteOptions: {
          integration: new WebSocketLambdaIntegration(
            'DisconnectIntegration',
            props.disconnectFunction
          ),
        },
        description:
          'Handles WebSocket connections for deployment status updates.',
      }
    );

    this.websocketStage = new apigatewayv2.WebSocketStage(
      this,
      'DeploymentWebSocketStage',
      {
        webSocketApi: this.websocketApi,
        stageName: 'prod',
        autoDeploy: true,
      }
    );
  }
}
