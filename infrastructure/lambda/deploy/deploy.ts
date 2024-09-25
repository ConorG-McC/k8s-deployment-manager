import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { KubeConfig, AppsV1Api, CoreV1Api } from '@kubernetes/client-node';
import { v4 as uuidv4 } from 'uuid';
import * as yaml from 'js-yaml';

const secretsManager = new AWS.SecretsManager();
const apigatewaymanagementapi = new AWS.ApiGatewayManagementApi({
  endpoint:
    process.env.WEBSOCKET_API_ENDPOINT?.replace('wss://', '')
      .replace('https://', '')
      .split('/')[0] || '',
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const timestamp = new Date().toISOString();
  const deploymentId = uuidv4();
  let connectionId = '';

  try {
    // Parse input
    const body = JSON.parse(event.body || '{}');
    const { imageName, serviceName, port, replicas, connectionId: cid } = body;
    connectionId = cid;

    // Validate input
    if (!imageName || !serviceName || !port || !replicas || !connectionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Initialize deployment status
    let status = 'YAML Construction Started';
    await sendMessage(connectionId, { status, deploymentId, timestamp });

    // Construct Kubernetes YAMLs
    const deploymentYaml = constructDeploymentYAML(
      serviceName,
      imageName,
      port,
      replicas
    );
    const serviceYaml = constructServiceYAML(serviceName, port);

    status = 'YAML Construction Completed';
    await sendMessage(connectionId, { status, deploymentId, timestamp });

    // Retrieve KubeConfig from Secrets Manager
    const kubeConfigString = await getKubeConfig();

    // Initialize Kubernetes Client
    const kc = new KubeConfig();
    kc.loadFromString(kubeConfigString);
    const appsV1Api = kc.makeApiClient(AppsV1Api);
    const coreV1Api = kc.makeApiClient(CoreV1Api);

    // Apply Deployment
    status = 'Applying Kubernetes Deployment';
    await sendMessage(connectionId, { status, deploymentId, timestamp });
    await appsV1Api.createNamespacedDeployment(
      'default',
      yaml.load(deploymentYaml) as any
    );

    // Apply Service
    status = 'Applying Kubernetes Service';
    await sendMessage(connectionId, { status, deploymentId, timestamp });
    await coreV1Api.createNamespacedService(
      'default',
      yaml.load(serviceYaml) as any
    );

    // Retrieve Service URL
    const appUrl = await getServiceURL(coreV1Api, serviceName, port, 60); // 60 seconds timeout

    // Finalize Deployment
    status = 'Deployment Completed';
    await sendMessage(connectionId, {
      status,
      deploymentId,
      timestamp,
      appUrl,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ deploymentId, status, appUrl }),
    };
  } catch (error: any) {
    console.error('Deployment Error:', error);

    // Update deployment status to Failed
    const status = 'Deployment Failed';
    if (connectionId) {
      await sendMessage(connectionId, {
        status,
        deploymentId,
        timestamp,
        error: error.message,
      });
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Deployment Failed',
        details: error.message,
      }),
    };
  }
};

function constructDeploymentYAML(
  serviceName: string,
  imageName: string,
  port: number,
  replicas: number
): string {
  return yaml.dump({
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: { name: serviceName },
    spec: {
      replicas: replicas,
      selector: { matchLabels: { app: serviceName } },
      template: {
        metadata: { labels: { app: serviceName } },
        spec: {
          containers: [
            {
              name: serviceName,
              image: imageName,
              ports: [{ containerPort: port }],
            },
          ],
        },
      },
    },
  });
}

function constructServiceYAML(serviceName: string, port: number): string {
  return yaml.dump({
    apiVersion: 'v1',
    kind: 'Service',
    metadata: { name: serviceName },
    spec: {
      selector: { app: serviceName },
      ports: [{ protocol: 'TCP', port: port, targetPort: port }],
      type: 'LoadBalancer',
    },
  });
}

async function getKubeConfig(): Promise<string> {
  const secretName = process.env.EKS_KUBECONFIG_SECRET || '';
  const data = await secretsManager
    .getSecretValue({ SecretId: secretName })
    .promise();
  if (!data.SecretString) {
    throw new Error('KubeConfig secret is empty');
  }
  return data.SecretString;
}

async function getServiceURL(
  coreV1Api: CoreV1Api,
  serviceName: string,
  port: number,
  timeoutSeconds: number
): Promise<string> {
  const maxRetries = Math.ceil(timeoutSeconds / 5); // 5 seconds interval
  for (let i = 0; i < maxRetries; i++) {
    const res = await coreV1Api.readNamespacedService(serviceName, 'default');
    const service = res.body;
    const ingress = service.status?.loadBalancer?.ingress;
    if (ingress && ingress.length > 0) {
      const ip = ingress[0].ip || ingress[0].hostname;
      const appUrl = `http://${ip}:${port}`; // Adjust protocol and port as needed
      return appUrl;
    }
    // Wait for 5 seconds before retrying
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(
    'Service did not obtain an external IP/Hostname within the expected time.'
  );
}

async function sendMessage(connectionId: string, message: any) {
  const params = {
    ConnectionId: connectionId,
    Data: JSON.stringify(message),
  };
  try {
    await apigatewaymanagementapi.postToConnection(params).promise();
  } catch (error) {
    console.error('Failed to send message:', error);
    // Handle specific errors if needed (e.g., connection not found)
  }
}
