import request from 'supertest';
import { WebSocket } from 'ws';
import { app, server } from './index';
import e from 'express';

jest.mock('@kubernetes/client-node', () => {
  class FakeKubeConfig {
    loadFromDefault() {}
    makeApiClient(api: any) {
      return {
        readNamespace: jest.fn().mockResolvedValue({}),
        createNamespace: jest.fn().mockResolvedValue({}),
        createNamespacedDeployment: jest.fn().mockResolvedValue({}),
        readNamespacedDeploymentStatus: jest.fn().mockResolvedValue({
          body: { status: { availableReplicas: 1 }, spec: { replicas: 1 } },
        }),
        createNamespacedService: jest.fn().mockResolvedValue({}),
      };
    }
  }
  return {
    KubeConfig: FakeKubeConfig,
    AppsV1Api: class {},
    CoreV1Api: class {},
  };
});

describe('Integration Tests for Index', () => {
  let testServer: any;
  let port: number;

  beforeAll((done) => {
    testServer = server.listen(0, () => {
      port = (testServer.address() as any).port;
      done();
    });
  });

  afterAll((done) => {
    testServer.close(done);
  });

  describe('POST /deploy', () => {
    test('should return a deploymentId for valid deployment details', async () => {
      const response = await request(app)
        .post('/deploy')
        .send({
          imageName: 'nginx:latest',
          serviceName: 'test-service',
          namespace: 'default',
          port: 80,
          replicas: 1,
        })
        .expect(200);
      expect(response.body).toHaveProperty('deploymentId');
      expect(typeof response.body.deploymentId).toBe('string');
    });

    test('should return 500 for invalid deployment details', async () => {
      const response = await request(app)
        .post('/deploy')
        .send({
          imageName: '',
          serviceName: '',
          namespace: '',
          port: 0,
          replicas: 0,
        })
        .expect(500);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('object');
    });
  });

  describe('WebSocket Connections', () => {
    test('should close connection with invalid deployment ID', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/invalid-deployment`);
      ws.on('close', (code, reason) => {
        expect(code).toBe(1008);
        done();
      });
    });

    test('should connect and receive initial deployment data for a valid deployment ID', (done) => {
      request(app)
        .post('/deploy')
        .send({
          imageName: 'nginx:latest',
          serviceName: 'test-service',
          namespace: 'default',
          port: 80,
          replicas: 1,
        })
        .expect(200)
        .then((res) => {
          const deploymentId = res.body.deploymentId;
          const ws = new WebSocket(`ws://localhost:${port}/${deploymentId}`);
          let timeoutId: NodeJS.Timeout;
          ws.on('open', () => {
            // Start a timeout to ensure we do not wait indefinitely
            timeoutId = setTimeout(() => {
              ws.close();
              done(new Error('Timeout waiting for message'));
            }, 3000);
          });
          ws.on('message', (data) => {
            clearTimeout(timeoutId);
            const message = JSON.parse(data.toString());
            expect(message).toHaveProperty('state');
            ws.close();
            done();
          });
          ws.on('error', (err) => {
            clearTimeout(timeoutId);
            done(err);
          });
        })
        .catch(done);
    });
  });
});
