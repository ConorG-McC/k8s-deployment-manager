import { DeploymentMap, DeploymentState, DeploymentStatus } from 'data-types';

export class DeploymentManager {
  private deployments: DeploymentMap = new Map();

  addDeployment(imageName: string): string {
    const deploymentId = `${imageName}-${Date.now()}`;
    this.deployments.set(deploymentId, {
      progress: 0,
      state: DeploymentState.Pending,
    });
    return deploymentId;
  }

  getDeployment(deploymentId: string): DeploymentStatus | undefined {
    return this.deployments.get(deploymentId);
  }

  updateProgress(deploymentId: string): DeploymentStatus | undefined {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return;

    deployment.progress = Math.min(
      deployment.progress + Math.random() * 20,
      100
    );
    deployment.state =
      deployment.progress >= 100
        ? DeploymentState.Completed
        : DeploymentState.Running;

    return deployment;
  }
}
