import { DeploymentManager } from './deploymentManager';
import { DeploymentState } from 'data-types';

const TEST_IMAGE_NAME = 'test-image';
const NON_EXISTENT_ID = 'non-existent-id';

describe('DeploymentManager', () => {
  let deploymentManager: DeploymentManager;

  beforeEach(() => {
    deploymentManager = new DeploymentManager();
  });

  describe('Adding and retrieving deployments', () => {
    it('should add a deployment and return a deployment ID', () => {
      const deploymentId = deploymentManager.addDeployment(TEST_IMAGE_NAME);

      expect(deploymentId).toContain(TEST_IMAGE_NAME);
      expect(deploymentManager.getDeployment(deploymentId)).toEqual({
        progress: 0,
        state: DeploymentState.Pending,
      });
    });

    it('should retrieve a deployment by ID', () => {
      const deploymentId = deploymentManager.addDeployment(TEST_IMAGE_NAME);

      const deployment = deploymentManager.getDeployment(deploymentId);
      expect(deployment).toBeDefined();
      expect(deployment?.state).toBe(DeploymentState.Pending);
    });

    it('should return undefined for a non-existent deployment ID', () => {
      expect(deploymentManager.getDeployment(NON_EXISTENT_ID)).toBeUndefined();
    });
  });

  describe('Updating deployment state and progress', () => {
    it('should update progress and state correctly', () => {
      const deploymentId = deploymentManager.addDeployment(TEST_IMAGE_NAME);

      const updatedDeployment = deploymentManager.updateProgress(deploymentId);
      expect(updatedDeployment).toBeDefined();
      expect(updatedDeployment?.progress).toBeGreaterThan(0);

      if (updatedDeployment?.progress === 100) {
        expect(updatedDeployment.state).toBe(DeploymentState.Completed);
      } else {
        expect(updatedDeployment?.state).toBe(DeploymentState.Running);
      }
    });
  });
});
