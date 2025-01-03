export interface DeploymentStatus {
  details: DeploymentDetails;
  state: DeploymentState;
}

export interface DeploymentDetails {
  imageName: string;
  serviceName: string;
  namespace: string;
  port: string;
  replicas: number;
  serviceUrl?: string | undefined;
}

export enum DeploymentState {
  Pending = 'Pending',
  Validating = 'Validating Deployment Details',
  NamespaceCheck = 'Checking namespace availability',
  NamespaceCreated = 'Namespace created',
  CreatingDeployment = 'Creating deployment',
  DeploymentCreated = 'Deployment created',
  CreatingService = 'Creating service',
  ServiceCreated = 'Service created',
  WaitingForPods = 'Waiting for pods to be ready',
  PodsReady = 'Pods are ready',
  PortForwarding = 'Forwarding port to host machine',
  Completed = 'Deployment completed',
  Failed = 'Deployment failed',
}

export type DeploymentMap = Map<string, DeploymentStatus>;
