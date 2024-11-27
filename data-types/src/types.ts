export interface DeploymentStatus {
  progress: number;
  state: DeploymentState;
}

export interface DeploymentDetails {
  imageName: string;
  serviceName: string;
  port: string;
  replicas: number;
}

export enum DeploymentState {
  Pending = 'Pending',
  Running = 'Running',
  Completed = 'Completed',
  Failed = 'Failed',
}

export type DeploymentMap = Map<string, DeploymentStatus>;
