import {
  DeploymentDetails,
  DeploymentMap,
  DeploymentState,
  DeploymentStatus,
} from 'data-types';
import * as k8s from '@kubernetes/client-node';
import { exec } from 'child_process';
import { EventEmitter } from 'events';

export class DeploymentManager extends EventEmitter {
  private deployments: DeploymentMap = new Map();
  private k8sAppsApi: k8s.AppsV1Api;
  private k8sCoreApi: k8s.CoreV1Api;

  constructor() {
    super();
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    this.k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
    this.k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
  }

  /**
   * Add deployment to in-memory store
   */
  async addDeployment(details: DeploymentDetails): Promise<string> {
    const { serviceName } = details;
    const deploymentId = `${serviceName}-${Date.now()}`;
    console.log('Deployment details validated successfully.');
    this.deployments.set(deploymentId, {
      details,
      state: DeploymentState.Pending,
    });
    return deploymentId;
  }

  /**
   * Retrieve deployment by ID
   */
  getDeployment(deploymentId: string): DeploymentStatus | undefined {
    return this.deployments.get(deploymentId);
  }

  /**
   * Ensure namespace exists or create it
   */
  async checkNamespace(deploymentId: string, namespace: string): Promise<void> {
    this.updateDeploymentState(deploymentId, DeploymentState.NamespaceCheck);
    console.log(`Checking namespace: ${namespace}`);
    try {
      await this.k8sCoreApi.readNamespace(namespace);
    } catch (err: any) {
      if (err.response?.body.code === 404) {
        console.log(`Namespace '${namespace}' not found. Creating it...`);
        const namespaceManifest: k8s.V1Namespace = {
          apiVersion: 'v1',
          kind: 'Namespace',
          metadata: { name: namespace },
        };
        await this.k8sCoreApi.createNamespace(namespaceManifest);
        this.updateDeploymentState(
          deploymentId,
          DeploymentState.NamespaceCreated
        );
        console.log(`Namespace '${namespace}' created.`);
      } else {
        this.updateDeploymentState(deploymentId, DeploymentState.Failed);
        console.error(`Error checking namespace '${namespace}':`, err.message);
        throw err;
      }
    }
  }

  /**
   * Start Kubernetes deployment
   */
  async startDeployment(deploymentId: string): Promise<void> {
    this.updateDeploymentState(
      deploymentId,
      DeploymentState.CreatingDeployment
    );
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`No deployment found for ID: ${deploymentId}`);
    }

    const serviceType = 'NodePort';
    const { imageName, serviceName, namespace, port, replicas } =
      deployment.details;

    const deploymentManifest: k8s.V1Deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: serviceName, namespace },
      spec: {
        replicas,
        selector: { matchLabels: { app: serviceName } },
        template: {
          metadata: { labels: { app: serviceName } },
          spec: {
            containers: [
              {
                name: serviceName,
                image: imageName,
                ports: [{ containerPort: Number(port) }],
              },
            ],
          },
        },
      },
    };

    try {
      await this.k8sAppsApi.createNamespacedDeployment(
        namespace,
        deploymentManifest
      );
      this.updateDeploymentState(
        deploymentId,
        DeploymentState.DeploymentCreated
      );
      console.log(
        `Deployment '${serviceName}' created in namespace '${namespace}'.`
      );

      this.updateDeploymentState(deploymentId, DeploymentState.CreatingService);
      await this.createService(
        serviceName,
        namespace,
        Number(port),
        serviceType
      );
      this.updateDeploymentState(deploymentId, DeploymentState.ServiceCreated);

      this.updateDeploymentState(deploymentId, DeploymentState.WaitingForPods);
      await this.waitForDeploymentReady(namespace, serviceName);
      this.updateDeploymentState(deploymentId, DeploymentState.PodsReady);

      const randomPort = Math.floor(Math.random() * 10000) + 30000;

      this.updateDeploymentState(deploymentId, DeploymentState.PortForwarding);

      await this.portForwardService(
        namespace,
        `${serviceName}-service`,
        randomPort,
        Number(port)
      );

      deployment.details.serviceUrl = `http://127.0.0.1:${randomPort}`;
      console.log(`Service available at http://127.0.0.1:${randomPort}`);

      this.updateDeploymentState(deploymentId, DeploymentState.Completed);
    } catch (err: any) {
      this.updateDeploymentState(deploymentId, DeploymentState.Failed);
      console.error('Error starting deployment:', err.message);
      throw err;
    }
  }

  /**
   * Create a service
   */
  async createService(
    serviceName: string,
    namespace: string,
    port: number,
    serviceType: 'ClusterIP' | 'NodePort' | 'LoadBalancer'
  ): Promise<void> {
    const serviceManifest: k8s.V1Service = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name: `${serviceName}-service`, namespace },
      spec: {
        type: serviceType,
        selector: { app: serviceName },
        ports: [{ port, targetPort: port }],
      },
    };

    try {
      await this.k8sCoreApi.createNamespacedService(namespace, serviceManifest);
      console.log(
        `Service '${serviceName}-service' of type '${serviceType}' created.`
      );
    } catch (err: any) {
      console.error('Error creating service:', err.message);
      throw err;
    }
  }

  /**
   * Wait for deployment readiness
   */
  private async waitForDeploymentReady(
    namespace: string,
    serviceName: string,
    timeout = 30000
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const resp = await this.k8sAppsApi.readNamespacedDeploymentStatus(
        serviceName,
        namespace
      );
      const availableReplicas = resp.body.status?.availableReplicas || 0;
      const desiredReplicas = resp.body.spec?.replicas || 0;

      if (availableReplicas === desiredReplicas) {
        console.log(
          `Deployment '${serviceName}' is ready with ${availableReplicas} replicas.`
        );
        return;
      }

      console.log(
        `Waiting for deployment '${serviceName}' to be ready... (${availableReplicas}/${desiredReplicas} replicas available)`
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    throw new Error(
      `Deployment '${serviceName}' did not become ready within the timeout period.`
    );
  }

  /**
   * Port-forward a service to localhost
   */
  private async portForwardService(
    namespace: string,
    serviceName: string,
    localPort: number,
    servicePort: number
  ): Promise<void> {
    const command = `kubectl port-forward service/${serviceName} ${localPort}:${servicePort} -n ${namespace}`;
    console.log(`Executing: ${command}`);

    const process = exec(command);

    process.stdout?.on('data', (data) => {
      console.log(`Port-forward output: ${data}`);
    });

    process.stderr?.on('data', (data) => {
      console.error(`Port-forward error: ${data}`);
    });

    process.on('close', (code) => {
      console.log(`Port-forward process exited with code ${code}`);
    });
  }

  /**
   * Update deployment state
   */
  updateDeploymentState(
    deploymentId: string,
    newState: DeploymentState
  ): DeploymentStatus | undefined {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      console.error(`Deployment ID '${deploymentId}' not found.`);
      return undefined;
    }

    deployment.state = newState;
    this.emit('stateChange', deploymentId, deployment); // Emit event
    return deployment;
  }
}
