// DeploymentManager.full.test.ts

import { DeploymentManager } from './deploymentManager';
import * as k8s from '@kubernetes/client-node';
import { ChildProcess } from 'child_process';
import { DeploymentDetails, DeploymentState } from 'data-types';

// Factory function to create a new DeploymentManager instance with fake dependencies.
const createDeploymentManager = (): DeploymentManager => {
  const fakeAppsApi: Partial<k8s.AppsV1Api> = {
    createNamespacedDeployment: jest.fn().mockResolvedValue({}),
    readNamespacedDeploymentStatus: jest.fn().mockResolvedValue({
      body: { status: { availableReplicas: 1 }, spec: { replicas: 1 } },
    }),
  };

  const fakeCoreApi: Partial<k8s.CoreV1Api> = {
    readNamespace: jest.fn().mockResolvedValue({}),
    createNamespace: jest.fn().mockResolvedValue({}),
    createNamespacedService: jest.fn().mockResolvedValue({}),
  };

  const fakeKubeClients = {
    appsApi: fakeAppsApi as k8s.AppsV1Api,
    coreApi: fakeCoreApi as k8s.CoreV1Api,
  };

  const fakeProcessExecutor = {
    execCommand: jest.fn().mockReturnValue({
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((event: string, callback: (code: number) => void) => {
        if (event === 'close') {
          callback(0);
        }
      }),
    } as unknown as ChildProcess),
  };

  return new DeploymentManager({
    kubeClients: fakeKubeClients,
    processExecutor: fakeProcessExecutor,
    simulateDelays: false,
  });
};

const sampleValidDetails: DeploymentDetails = {
  imageName: 'nginx:latest',
  serviceName: 'test-service',
  namespace: 'default',
  port: 80,
  replicas: 1,
};

const sampleInvalidDetails: DeploymentDetails = {
  imageName: '',
  serviceName: '',
  namespace: '',
  port: 0,
  replicas: 0,
};

describe('DeploymentManager Tests', () => {
  let manager: DeploymentManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = createDeploymentManager();
  });

  describe('addDeployment()', () => {
    test('should add a deployment with initial state "Pending"', async () => {
      const deploymentId = await manager.addDeployment(sampleValidDetails);
      const deployment = manager.getDeployment(deploymentId);
      expect(deployment).toBeDefined();
      expect(deployment?.state).toBe(DeploymentState.Pending);
    });
  });

  describe('validateDeploymentDetails()', () => {
    test('should complete successfully for valid details', async () => {
      const deploymentId = await manager.addDeployment(sampleValidDetails);
      await expect(
        manager.validateDeploymentDetails(deploymentId, sampleValidDetails)
      ).resolves.toBeUndefined();
    });

    test('should throw an error when imageName is missing', async () => {
      const invalidDetails = { ...sampleValidDetails, imageName: '' };
      const deploymentId = 'deployment-123';
      await expect(
        manager.validateDeploymentDetails(deploymentId, invalidDetails)
      ).rejects.toThrow('Image name is required and cannot be empty.');
    });

    test('should throw an error when replicas is less than 1', async () => {
      const invalidDetails = { ...sampleValidDetails, replicas: 0 };
      const deploymentId = 'deployment-123';
      await expect(
        manager.validateDeploymentDetails(deploymentId, invalidDetails)
      ).rejects.toThrow('Replicas must be a positive integer.');
    });
  });

  describe('checkNamespace()', () => {
    test('should read the namespace if it exists (happy path)', async () => {
      const deploymentId = await manager.addDeployment(sampleValidDetails);
      await manager.checkNamespace(deploymentId, sampleValidDetails.namespace);
      expect(manager['k8sCoreApi'].readNamespace).toHaveBeenCalledWith(
        sampleValidDetails.namespace
      );
      expect(manager['k8sCoreApi'].createNamespace).not.toHaveBeenCalled();
    });

    test('should create the namespace if not found (404 error, sad path)', async () => {
      const deploymentId = await manager.addDeployment(sampleValidDetails);
      (manager['k8sCoreApi'].readNamespace as jest.Mock).mockRejectedValueOnce({
        response: { body: { code: 404 } },
      });
      await manager.checkNamespace(deploymentId, sampleValidDetails.namespace);
      expect(manager['k8sCoreApi'].createNamespace).toHaveBeenCalled();
    });

    test('should throw an error for non-404 errors (sad path)', async () => {
      const deploymentId = await manager.addDeployment(sampleValidDetails);
      (manager['k8sCoreApi'].readNamespace as jest.Mock).mockRejectedValueOnce(
        new Error('Unexpected error')
      );
      await expect(
        manager.checkNamespace(deploymentId, sampleValidDetails.namespace)
      ).rejects.toThrow('Unexpected error');
    });
  });

  describe('createService()', () => {
    test('should call createNamespacedService with correct parameters', async () => {
      await manager.createService(
        sampleValidDetails.serviceName,
        sampleValidDetails.namespace,
        sampleValidDetails.port,
        'NodePort'
      );
      expect(
        manager['k8sCoreApi'].createNamespacedService
      ).toHaveBeenCalledWith(
        sampleValidDetails.namespace,
        expect.objectContaining({
          metadata: {
            name: `${sampleValidDetails.serviceName}-service`,
            namespace: sampleValidDetails.namespace,
          },
          spec: expect.objectContaining({
            type: 'NodePort',
            selector: { app: sampleValidDetails.serviceName },
            ports: [
              {
                port: sampleValidDetails.port,
                targetPort: sampleValidDetails.port,
              },
            ],
          }),
        })
      );
    });

    test('should throw an error if createNamespacedService fails', async () => {
      (
        manager['k8sCoreApi'].createNamespacedService as jest.Mock
      ).mockRejectedValueOnce(new Error('Service creation failed'));
      await expect(
        manager.createService(
          sampleValidDetails.serviceName,
          sampleValidDetails.namespace,
          sampleValidDetails.port,
          'NodePort'
        )
      ).rejects.toThrow('Service creation failed');
    });
  });

  describe('portForwardService()', () => {
    test('should execute the correct port-forward command', async () => {
      const namespace = sampleValidDetails.namespace;
      const serviceName = `${sampleValidDetails.serviceName}-service`;
      const localPort = 30000;
      const servicePort = sampleValidDetails.port;
      await manager.portForwardService(
        namespace,
        serviceName,
        localPort,
        servicePort
      );
      const expectedCommand = `kubectl port-forward service/${serviceName} ${localPort}:${servicePort} -n ${namespace}`;
      expect(manager['processExecutor'].execCommand).toHaveBeenCalledWith(
        expectedCommand
      );
    });
  });

  describe('updateDeploymentState()', () => {
    test('should emit stateChange event with the new state', async () => {
      const deploymentId = await manager.addDeployment(sampleValidDetails);
      const stateChangeListener = jest.fn();
      manager.on('stateChange', stateChangeListener);
      manager.updateDeploymentState(
        deploymentId,
        DeploymentState.CreatingDeployment
      );
      expect(stateChangeListener).toHaveBeenCalledWith(
        deploymentId,
        expect.objectContaining({ state: DeploymentState.CreatingDeployment })
      );
    });
  });

  describe('startDeployment()', () => {
    test('should complete the full deployment flow and set serviceUrl (happy path)', async () => {
      const deploymentId = await manager.addDeployment(sampleValidDetails);
      await manager.startDeployment(deploymentId);
      const deployment = manager.getDeployment(deploymentId);
      expect(deployment?.state).toBe(DeploymentState.Completed);
      expect(deployment?.details.serviceUrl).toMatch(
        /^http:\/\/127\.0\.0\.1:\d+$/
      );
    });

    test('should throw an error if any step in the flow fails (sad path)', async () => {
      const deploymentId = await manager.addDeployment(sampleValidDetails);
      (
        manager['k8sAppsApi'].createNamespacedDeployment as jest.Mock
      ).mockRejectedValueOnce(new Error('Deployment creation error'));
      await expect(manager.startDeployment(deploymentId)).rejects.toThrow(
        'Deployment creation error'
      );
    });
  });

  describe('handleDeployment()', () => {
    test('should orchestrate the full deployment process successfully', async () => {
      const deploymentId = await manager.addDeployment(sampleValidDetails);
      await expect(
        manager.handleDeployment(deploymentId, sampleValidDetails)
      ).resolves.toBeUndefined();
      const deployment = manager.getDeployment(deploymentId);
      expect(deployment?.state).toBe(DeploymentState.Completed);
      expect(deployment?.details.serviceUrl).toMatch(
        /^http:\/\/127\.0\.0\.1:\d+$/
      );
    });
  });
});
