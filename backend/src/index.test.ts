import request from 'supertest';
import { WebSocket } from 'ws';
import { app, server } from './index';
import { DeploymentManager } from './services/deploymentManager';
import { DeploymentState } from 'data-types';

// Mock DeploymentManager to isolate its behavior
jest.mock('./services/deploymentManager');

const MockDeploymentManager = DeploymentManager as jest.MockedClass<
  typeof DeploymentManager
>;

// Constants for test data
const TEST_DEPLOYMENT_ID = 'valid-deployment-id';
const INVALID_DEPLOYMENT_ID = 'invalid-deployment-id';
const TEST_IMAGE_NAME = 'test-image';
const TEST_SERVICE_NAME = 'test-service';
const WS_BASE_URL = 'ws://localhost:3001';

describe('Integration tests for endpoints and WebSocket connections', () => {
  beforeAll((done) => {
    server.listen(3001, done); // Start server for tests
  });

  afterAll(() => {
    server.close(); // Close server after all tests
  });

  beforeEach(() => {
    // Clear mocks before each test
    MockDeploymentManager.prototype.addDeployment.mockClear();
    MockDeploymentManager.prototype.getDeployment.mockClear();
    MockDeploymentManager.prototype.updateProgress.mockClear();
  });

  describe('HTTP Endpoint Tests', () => {
    it('should return 400 for invalid deployment details', async () => {
      const invalidDeploymentDetails = {
        imageName: '',
        serviceName: '',
        port: 0,
        replicas: 0,
      };

      const response = await request(app)
        .post('/deploy')
        .send(invalidDeploymentDetails);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid deployment details');
    });

    it('should create a deployment and return deployment ID', async () => {
      MockDeploymentManager.prototype.addDeployment.mockReturnValueOnce(
        TEST_DEPLOYMENT_ID
      );

      const validDeploymentDetails = {
        imageName: TEST_IMAGE_NAME,
        serviceName: TEST_SERVICE_NAME,
        port: 80,
        replicas: 1,
      };

      const response = await request(app)
        .post('/deploy')
        .send(validDeploymentDetails);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ deploymentId: TEST_DEPLOYMENT_ID });
      expect(
        MockDeploymentManager.prototype.addDeployment
      ).toHaveBeenCalledWith(TEST_IMAGE_NAME);
    });
  });

  describe('WebSocket Tests', () => {
    it('should close the WebSocket for an invalid deployment ID', (done) => {
      MockDeploymentManager.prototype.getDeployment.mockReturnValue(undefined);

      const ws = new WebSocket(`${WS_BASE_URL}/${INVALID_DEPLOYMENT_ID}`);

      ws.on('open', () => {}); // Ensure connection opens before close event
      ws.on('close', (code) => {
        expect(code).toBe(1008); // Policy violation
        done();
      });
      ws.on('error', (err) => {
        done(err); // Fail test if error occurs
      });
    });

    it('should send progress updates for a valid deployment ID', (done) => {
      MockDeploymentManager.prototype.getDeployment.mockReturnValueOnce({
        progress: 0,
        state: DeploymentState.Pending,
      });

      MockDeploymentManager.prototype.updateProgress.mockReturnValueOnce({
        progress: 50,
        state: DeploymentState.Running,
      });

      const ws = new WebSocket(`${WS_BASE_URL}/${TEST_DEPLOYMENT_ID}`);

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.progress).toBe(50);
        expect(message.state).toBe('Running');
        ws.close();
        done();
      });

      ws.on('error', (err) => {
        done(err); // Fail test if error occurs
      });
    });

    it('should send progress updates until deployment is completed', (done) => {
      MockDeploymentManager.prototype.getDeployment.mockReturnValueOnce({
        progress: 0,
        state: DeploymentState.Pending,
      });

      MockDeploymentManager.prototype.updateProgress.mockImplementation(() => ({
        progress: 100,
        state: DeploymentState.Completed,
      }));

      const ws = new WebSocket(`${WS_BASE_URL}/${TEST_DEPLOYMENT_ID}`);

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.progress === 100) {
          expect(message.state).toBe('Completed');
          ws.close();
          done();
        }
      });

      ws.on('error', (err) => {
        done(err); // Fail test if error occurs
      });
    });
  });
});
