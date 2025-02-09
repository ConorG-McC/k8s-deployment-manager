import { WebSocket } from 'ws';
import { DeploymentStatus } from 'data-types';

export class WebSocketManager {
  private connections: Map<string, Set<WebSocket>> = new Map();

  addConnection(deploymentId: string, ws: WebSocket): void {
    if (!this.connections.has(deploymentId)) {
      this.connections.set(deploymentId, new Set());
    }
    this.connections.get(deploymentId)?.add(ws);
    console.log(`WebSocket connected for deployment ID: ${deploymentId}`);
  }

  removeConnection(deploymentId: string, ws: WebSocket): void {
    const deploymentConnections = this.connections.get(deploymentId);
    if (deploymentConnections) {
      deploymentConnections.delete(ws);
      console.log(`WebSocket disconnected for deployment ID: ${deploymentId}`);
      if (deploymentConnections.size === 0) {
        this.connections.delete(deploymentId);
      }
    }
  }

  broadcast(deploymentId: string, message: DeploymentStatus): void {
    const clients = this.connections.get(deploymentId);
    if (clients) {
      const data = JSON.stringify(message);
      clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
      console.log(
        `Broadcasted stateChange to ${clients.size} clients for deployment ID: ${deploymentId}`
      );
    }
  }

  closeConnections(deploymentId: string): void {
    const clients = this.connections.get(deploymentId);
    if (clients) {
      clients.forEach((ws) => {
        ws.close(1001, 'Deployment completed or failed');
      });
      this.connections.delete(deploymentId);
      console.log(
        `All WebSocket connections closed for deployment ID: ${deploymentId}`
      );
    }
  }
}
