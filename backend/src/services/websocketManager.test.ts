import { WebSocketManager } from './websocketManager';
import { DeploymentState, DeploymentStatus } from 'data-types';

const WS_OPEN = 1;

function createFakeWebSocket(): any {
  return {
    readyState: WS_OPEN,
    send: jest.fn(),
    close: jest.fn(),
  };
}

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;
  const deploymentId = 'deployment-123';

  beforeEach(() => {
    wsManager = new WebSocketManager();
  });

  describe('addConnection()', () => {
    test('should add a WebSocket connection for a given deployment ID', async () => {
      const fakeWs = createFakeWebSocket();
      wsManager.addConnection(deploymentId, fakeWs);

      const connections = (wsManager as any)['connections'].get(deploymentId);
      expect(connections).toBeDefined();
      expect(connections.has(fakeWs)).toBe(true);
    });
  });

  describe('removeConnection()', () => {
    test('should remove a WebSocket connection and delete the deployment entry if last connection is removed', async () => {
      const fakeWs1 = createFakeWebSocket();
      const fakeWs2 = createFakeWebSocket();
      wsManager.addConnection(deploymentId, fakeWs1);
      wsManager.addConnection(deploymentId, fakeWs2);

      wsManager.removeConnection(deploymentId, fakeWs1);
      let connections = (wsManager as any)['connections'].get(deploymentId);
      expect(connections.has(fakeWs1)).toBe(false);
      expect(connections.has(fakeWs2)).toBe(true);

      wsManager.removeConnection(deploymentId, fakeWs2);
      connections = (wsManager as any)['connections'].get(deploymentId);
      expect(connections).toBeUndefined();
    });
  });

  describe('broadcast()', () => {
    test('should send a JSON message to all open WebSocket clients', async () => {
      const fakeWsOpen = createFakeWebSocket();
      const fakeWsClosed = createFakeWebSocket();
      fakeWsClosed.readyState = 0;

      wsManager.addConnection(deploymentId, fakeWsOpen);
      wsManager.addConnection(deploymentId, fakeWsClosed);

      const message: DeploymentStatus = {
        details: {
          imageName: 'test',
          serviceName: 'test',
          namespace: 'test',
          port: 0,
          replicas: 0,
        },
        state: DeploymentState.Pending,
      };
      wsManager.broadcast(deploymentId, message);

      // Only the open connection should have received the message
      expect(fakeWsOpen.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(fakeWsClosed.send).not.toHaveBeenCalled();
    });

    test('should do nothing if no connections exist', async () => {
      const message: DeploymentStatus = {
        details: {
          imageName: 'test',
          serviceName: 'test',
          namespace: 'test',
          port: 0,
          replicas: 0,
        },
        state: DeploymentState.Pending,
      };
      expect(() => wsManager.broadcast('non-existent', message)).not.toThrow();
    });
  });

  describe('closeConnections()', () => {
    test('should close all connections and remove the deployment entry', async () => {
      const fakeWs1 = createFakeWebSocket();
      const fakeWs2 = createFakeWebSocket();
      wsManager.addConnection(deploymentId, fakeWs1);
      wsManager.addConnection(deploymentId, fakeWs2);

      wsManager.closeConnections(deploymentId);

      // Verify that close was called on each connection with expected arguments
      expect(fakeWs1.close).toHaveBeenCalledWith(
        1001,
        'Deployment completed or failed'
      );
      expect(fakeWs2.close).toHaveBeenCalledWith(
        1001,
        'Deployment completed or failed'
      );
      const connections = (wsManager as any)['connections'].get(deploymentId);
      expect(connections).toBeUndefined();
    });
  });
});
