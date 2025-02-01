import * as k8s from '@kubernetes/client-node';
import { ChildProcess } from 'child_process';

export interface IKubeClients {
  appsApi: k8s.AppsV1Api;
  coreApi: k8s.CoreV1Api;
}

export interface IProcessExecutor {
  execCommand(command: string): ChildProcess;
}

export interface DeploymentManagerOptions {
  kubeClients?: IKubeClients;
  processExecutor?: IProcessExecutor;
  simulateDelays?: boolean;
}

export interface DeploymentDetails {
  imageName: string;
  serviceName: string;
  namespace: string;
  port: number;
  replicas: number;
  serviceUrl?: string;
}

export interface DeploymentStatus {
  details: DeploymentDetails;
  state: DeploymentState;
}

export enum DeploymentState {
  Pending = 'Deployment Pending',
  Validating = 'Validating Deployment Details',
  NamespaceCheck = 'Checking namespace availability',
  NamespaceUnavailable = 'Namespace already exists',
  CreatingNamespace = 'Creating namespace',
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

export type VariantType =
  | 'neutral'
  | 'progressing'
  | 'warning'
  | 'success'
  | 'error';

export interface DeploymentStateInfo {
  percentage: number;
  variant: VariantType;
}

export const DeploymentStateData: Record<DeploymentState, DeploymentStateInfo> =
  {
    [DeploymentState.Pending]: { percentage: 0, variant: 'neutral' },
    [DeploymentState.Validating]: { percentage: 10, variant: 'neutral' },
    [DeploymentState.NamespaceCheck]: { percentage: 20, variant: 'neutral' },
    [DeploymentState.NamespaceUnavailable]: {
      percentage: 20,
      variant: 'warning',
    },
    [DeploymentState.CreatingNamespace]: {
      percentage: 30,
      variant: 'progressing',
    },
    [DeploymentState.NamespaceCreated]: {
      percentage: 30,
      variant: 'progressing',
    },
    [DeploymentState.CreatingDeployment]: {
      percentage: 40,
      variant: 'progressing',
    },
    [DeploymentState.DeploymentCreated]: {
      percentage: 50,
      variant: 'progressing',
    },
    [DeploymentState.CreatingService]: {
      percentage: 60,
      variant: 'progressing',
    },
    [DeploymentState.ServiceCreated]: {
      percentage: 70,
      variant: 'progressing',
    },
    [DeploymentState.WaitingForPods]: { percentage: 80, variant: 'warning' },
    [DeploymentState.PodsReady]: { percentage: 90, variant: 'success' },
    [DeploymentState.PortForwarding]: { percentage: 95, variant: 'success' },
    [DeploymentState.Completed]: { percentage: 100, variant: 'success' },
    [DeploymentState.Failed]: { percentage: 100, variant: 'error' },
  };

export type Deployments = Map<string, DeploymentStatus>;
