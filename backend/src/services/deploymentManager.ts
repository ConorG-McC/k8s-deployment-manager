import { EventEmitter } from 'events';
import * as k8s from '@kubernetes/client-node';
import { ChildProcess, exec } from 'child_process';
import {
  DeploymentDetails,
  Deployments,
  DeploymentState,
  DeploymentStatus,
  IProcessExecutor,
  DeploymentManagerOptions,
} from 'data-types';
import { sleep } from '../utils/sleep';
import { ProcessExecutor } from '../utils/processExecutor';
import { logError, logInfo } from '../utils/logger';

const DELAY_VALIDATION = 2000;

export class DeploymentManager extends EventEmitter {
  private deployments: Deployments = new Map();
  private k8sAppsApi: k8s.AppsV1Api;
  private k8sCoreApi: k8s.CoreV1Api;
  private portForwardProcesses: Map<string, ChildProcess> = new Map();
  private processExecutor: IProcessExecutor;
  private simulateDelays: boolean;

  constructor(props: DeploymentManagerOptions = {}) {
    super();
    const { kubeClients, processExecutor, simulateDelays = false } = props;

    if (kubeClients) {
      this.k8sAppsApi = kubeClients.appsApi;
      this.k8sCoreApi = kubeClients.coreApi;
    } else {
      const kc = new k8s.KubeConfig();
      kc.loadFromDefault();
      this.k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
      this.k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
    }

    this.processExecutor = processExecutor || new ProcessExecutor();
    this.simulateDelays = simulateDelays;
  }

  private delay(ms: number): Promise<void> {
    return this.simulateDelays ? sleep(ms) : Promise.resolve();
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
      logError(`Error during deployment process for ID ${deploymentId}:`, err);
      throw err;
    }
  }

  async validateDeploymentDetails(
    deploymentId: string,
    details: DeploymentDetails
  ): Promise<void> {
    this.updateDeploymentState(deploymentId, DeploymentState.Validating);
    await this.delay(DELAY_VALIDATION);
    logInfo('Validating deployment details...');
    const { imageName, serviceName, namespace, port, replicas } = details;

    if (!imageName || imageName.trim() === '') {
      throw new Error('Image name is required and cannot be empty.');
    }

    if (!serviceName || serviceName.trim() === '') {
      throw new Error('Service name is required and cannot be empty.');
    }

    if (!namespace || namespace.trim() === '') {
      throw new Error('Namespace is required and cannot be empty.');
    }

    if (typeof port !== 'number' || port < 1 || port > 65535) {
      throw new Error('Port must be a number between 1 and 65535.');
    }

    if (!Number.isInteger(replicas) || replicas < 1) {
      throw new Error('Replicas must be a positive integer.');
    }
  }

  async addDeployment(details: DeploymentDetails): Promise<string> {
    const { imageName, serviceName, namespace, port, replicas } = details;

    if (!imageName || imageName.trim() === '') {
      throw new Error('Image name is required and cannot be empty.');
    }

    if (!serviceName || serviceName.trim() === '') {
      throw new Error('Service name is required and cannot be empty.');
    }

    if (!namespace || namespace.trim() === '') {
      throw new Error('Namespace is required and cannot be empty.');
    }

    if (port < 1 || port > 65535) {
      throw new Error('Port must be a number between 1 and 65535.');
    }

    if (replicas < 1) {
      throw new Error('Replicas must be a positive integer.');
    }
    const deploymentId = `${serviceName}-${Date.now()}`;
    logInfo('Deployment details validated successfully.');
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
    await this.delay(DELAY_VALIDATION);
    logInfo(`Checking namespace: ${namespace}`);
    try {
      await this.k8sCoreApi.readNamespace(namespace);
    } catch (err: any) {
      if (err.response?.body.code === 404) {
        logInfo(`Namespace '${namespace}' not found. Creating it...`);
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
        await this.delay(DELAY_VALIDATION);
        logInfo(`Namespace '${namespace}' created.`);
      } else {
        this.updateDeploymentState(deploymentId, DeploymentState.Failed);
        await this.delay(DELAY_VALIDATION);
        logError(`Error checking namespace '${namespace}':`, err.message);
        throw err;
      }
    }
  }

  async startDeployment(deploymentId: string): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`No deployment found for ID: ${deploymentId}`);
    }
    // Orchestrate the deployment steps
    await this.createDeployment(deploymentId, deployment.details);
    await this.setupService(deploymentId, deployment.details);
    await this.waitForPodsReady(
      deploymentId,
      deployment.details.namespace,
      deployment.details.serviceName
    );
    await this.setupPortForwarding(deploymentId, deployment.details);
  }

  private async createDeployment(
    deploymentId: string,
    details: DeploymentDetails
  ): Promise<void> {
    const { imageName, serviceName, namespace, port, replicas } = details;
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
      await this.delay(DELAY_VALIDATION);
      await this.k8sAppsApi.createNamespacedDeployment(
        namespace,
        deploymentManifest
      );
      this.updateDeploymentState(
        deploymentId,
        DeploymentState.DeploymentCreated
      );
      await this.delay(DELAY_VALIDATION);
      logInfo(
        `Deployment '${serviceName}' created in namespace '${namespace}'.`
      );
    } catch (err: any) {
      this.updateDeploymentState(deploymentId, DeploymentState.Failed);
      await this.delay(DELAY_VALIDATION);
      logError('Error creating deployment:', err.message);
      throw err;
    }
  }

  private async setupService(
    deploymentId: string,
    details: DeploymentDetails
  ): Promise<void> {
    this.updateDeploymentState(deploymentId, DeploymentState.CreatingService);
    await this.delay(DELAY_VALIDATION);
    await this.createService(
      details.serviceName,
      details.namespace,
      details.port,
      'NodePort'
    );
    this.updateDeploymentState(deploymentId, DeploymentState.ServiceCreated);
    await this.delay(DELAY_VALIDATION);
  }

  private async waitForPodsReady(
    deploymentId: string,
    namespace: string,
    serviceName: string
  ): Promise<void> {
    this.updateDeploymentState(deploymentId, DeploymentState.WaitingForPods);
    await this.delay(DELAY_VALIDATION);
    await this.waitForDeploymentReady(namespace, serviceName);
    this.updateDeploymentState(deploymentId, DeploymentState.PodsReady);
    await this.delay(DELAY_VALIDATION);
  }

  private async setupPortForwarding(
    deploymentId: string,
    details: DeploymentDetails
  ): Promise<void> {
    const serviceName = details.serviceName;
    const namespace = details.namespace;
    const randomPort = Math.floor(Math.random() * 10000) + 30000;
    this.updateDeploymentState(deploymentId, DeploymentState.PortForwarding);
    await this.delay(DELAY_VALIDATION);
    await this.portForwardService(
      namespace,
      `${serviceName}-service`,
      randomPort,
      details.port
    );
    // Update the service URL in the deployment details.
    const deployment = this.deployments.get(deploymentId);
    if (deployment) {
      deployment.details.serviceUrl = `http://127.0.0.1:${randomPort}`;
    }
    logInfo(`Service available at http://127.0.0.1:${randomPort}`);
    this.updateDeploymentState(deploymentId, DeploymentState.Completed);
    await this.delay(DELAY_VALIDATION);
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
      logInfo(
        `Service '${serviceName}-service' of type '${serviceType}' created.`
      );
    } catch (err: any) {
      logError('Error creating service:', err.message);
      throw err;
    }
  }

  private async waitForDeploymentReady(
    namespace: string,
    serviceName: string
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < 30000) {
      const resp = await this.k8sAppsApi.readNamespacedDeploymentStatus(
        serviceName,
        namespace
      );
      const availableReplicas = resp.body.status?.availableReplicas || 0;
      const desiredReplicas = resp.body.spec?.replicas || 0;
      if (availableReplicas === desiredReplicas) {
        logInfo(
          `Deployment '${serviceName}' is ready with ${availableReplicas} replicas.`
        );
        return;
      }
      logInfo(
        `Waiting for deployment '${serviceName}' to be ready... (${availableReplicas}/${desiredReplicas} replicas available)`
      );
      await this.delay(DELAY_VALIDATION);
    }
    throw new Error(
      `Deployment '${serviceName}' did not become ready within the timeout period.`
    );
  }

  async portForwardService(
    namespace: string,
    serviceName: string,
    localPort: number,
    servicePort: number
  ): Promise<void> {
    const command = `kubectl port-forward service/${serviceName} ${localPort}:${servicePort} -n ${namespace}`;
    logInfo(`Executing: ${command}`);
    const processInstance = this.processExecutor.execCommand(command);
    processInstance.stdout?.on('data', (data) => {
      logInfo(`Port-forward output: ${data}`);
    });
    processInstance.stderr?.on('data', (data) => {
      logError(`Port-forward error: ${data}`);
    });
    processInstance.on('close', (code) => {
      logInfo(`Port-forward process exited with code ${code}`);
    });
    this.portForwardProcesses.set(serviceName, processInstance);
  }

  updateDeploymentState(deploymentId: string, newState: DeploymentState): void {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      logError(`Deployment ID '${deploymentId}' not found.`);
      return;
    }
    deployment.state = newState;
    this.emit('stateChange', deploymentId, deployment);
  }
}
