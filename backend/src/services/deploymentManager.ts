import { EventEmitter } from 'events';
import * as k8s from '@kubernetes/client-node';
import { ChildProcess, exec } from 'child_process';
import {
  DeploymentDetails,
  Deployments,
  DeploymentState,
  DeploymentStatus,
} from 'data-types';
import { sleep } from '../utils/sleep';

export class DeploymentManager extends EventEmitter {
  private deployments: Deployments = new Map();
  private k8sAppsApi: k8s.AppsV1Api;
  private k8sCoreApi: k8s.CoreV1Api;
  private portForwardProcesses: Map<string, ChildProcess> = new Map();

  constructor() {
    super();
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    this.k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
    this.k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
  }

  async handleDeployment(
    deploymentId: string,
    details: DeploymentDetails
  ): Promise<void> {
    try {
      await this.validateDeploymentDetails(deploymentId, details);

      await this.checkNamespace(deploymentId, details.namespace);

      await this.startDeployment(deploymentId);
    } catch (err) {
      console.error(
        `Error during deployment process for ID ${deploymentId}:`,
        err
      );
      throw err;
    }
  }

  async validateDeploymentDetails(
    deploymentId: string,
    details: DeploymentDetails
  ) {
    this.updateDeploymentState(deploymentId, DeploymentState.Validating);
    await sleep(2000);

    console.log('Validating deployment details...');
    const { imageName, serviceName, namespace, port, replicas } = details;

    if (!imageName || !serviceName || !namespace || !port || replicas < 1) {
      throw new Error(
        'All fields are required, and replicas must be at least 1.'
      );
    }
  }

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

  getDeployment(deploymentId: string): DeploymentStatus | undefined {
    return this.deployments.get(deploymentId);
  }

  async checkNamespace(deploymentId: string, namespace: string): Promise<void> {
    this.updateDeploymentState(deploymentId, DeploymentState.NamespaceCheck);
    await sleep(2000);

    console.log(`Checking namespace: ${namespace}`);
    try {
      await this.k8sCoreApi.readNamespace(namespace);
    } catch (err: any) {
      if (err.response?.body.code === 404) {
        console.log(`Namespace '${namespace}' not found. Creating it...`);
        this.updateDeploymentState(
          deploymentId,
          DeploymentState.CreatingNamespace
        );
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
        await sleep(2000);

        console.log(`Namespace '${namespace}' created.`);
      } else {
        this.updateDeploymentState(deploymentId, DeploymentState.Failed);
        await sleep(2000);

        console.error(`Error checking namespace '${namespace}':`, err.message);
        throw err;
      }
    }
  }

  async startDeployment(deploymentId: string): Promise<void> {
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
                ports: [{ containerPort: port }],
              },
            ],
          },
        },
      },
    };

    try {
      this.updateDeploymentState(
        deploymentId,
        DeploymentState.CreatingDeployment
      );
      await sleep(2000);
      await this.k8sAppsApi.createNamespacedDeployment(
        namespace,
        deploymentManifest
      );
      this.updateDeploymentState(
        deploymentId,
        DeploymentState.DeploymentCreated
      );
      await sleep(2000);
      console.log(
        `Deployment '${serviceName}' created in namespace '${namespace}'.`
      );

      this.updateDeploymentState(deploymentId, DeploymentState.CreatingService);
      await sleep(2000);
      await this.createService(serviceName, namespace, port, serviceType);

      this.updateDeploymentState(deploymentId, DeploymentState.ServiceCreated);
      await sleep(2000);

      this.updateDeploymentState(deploymentId, DeploymentState.WaitingForPods);
      await sleep(2000);

      await this.waitForDeploymentReady(namespace, serviceName);
      this.updateDeploymentState(deploymentId, DeploymentState.PodsReady);
      await sleep(2000);

      const randomPort = Math.floor(Math.random() * 10000) + 30000;

      this.updateDeploymentState(deploymentId, DeploymentState.PortForwarding);
      await sleep(2000);

      await this.portForwardService(
        namespace,
        `${serviceName}-service`,
        randomPort,
        port
      );

      deployment.details.serviceUrl = `http://127.0.0.1:${randomPort}`;
      console.log(`Service available at http://127.0.0.1:${randomPort}`);

      this.updateDeploymentState(deploymentId, DeploymentState.Completed);
      await sleep(2000);
    } catch (err: any) {
      this.updateDeploymentState(deploymentId, DeploymentState.Failed);
      await sleep(2000);
      console.error('Error starting deployment:', err.message);
      throw err;
    }
  }

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
      await sleep(3000);
    }

    throw new Error(
      `Deployment '${serviceName}' did not become ready within the timeout period.`
    );
  }

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

    this.portForwardProcesses.set(serviceName, process);
  }

  updateDeploymentState(deploymentId: string, newState: DeploymentState): void {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      console.error(`Deployment ID '${deploymentId}' not found.`);
      return;
    }

    deployment.state = newState;
    this.emit('stateChange', deploymentId, deployment);
  }
}
