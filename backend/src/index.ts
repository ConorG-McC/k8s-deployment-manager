// backend/index.ts

import express, { Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { DeploymentManager } from './services/deploymentManager';
import {
  DeploymentDetails,
  DeploymentState,
  DeploymentStatus,
} from 'data-types';

const app = express();
const server = new HttpServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

const connections: Map<string, Set<WebSocket>> = new Map();

const deploymentManager = new DeploymentManager();

// Listen to stateChange events emitted by DeploymentManager
deploymentManager.on(
  'stateChange',
  (deploymentId: string, deploymentStatus: DeploymentStatus) => {
    const clients = connections.get(deploymentId);
    if (clients) {
      const message = JSON.stringify(deploymentStatus);
      clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }
);

app.post('/deploy', async (req: Request, res: Response) => {
  const {
    imageName,
    serviceName,
    namespace,
    port,
    replicas,
  }: DeploymentDetails = req.body;

  try {
    const deploymentId = await deploymentManager.addDeployment({
      imageName,
      serviceName,
      namespace,
      port,
      replicas,
    });

    // Immediately respond with deployment ID
    res.json({ deploymentId });

    // Start the deployment process asynchronously
    (async () => {
      try {
        deploymentManager.updateDeploymentState(
          deploymentId,
          DeploymentState.Validating
        );

        console.log('Validating deployment details...');
        if (!imageName || !serviceName || !namespace || !port || replicas < 1) {
          throw new Error(
            'All fields are required, and replicas must be at least 1.'
          );
        }
        deploymentManager.updateDeploymentState(
          deploymentId,
          DeploymentState.NamespaceCheck
        );
        await deploymentManager.checkNamespace(deploymentId, namespace);
        deploymentManager.updateDeploymentState(
          deploymentId,
          DeploymentState.NamespaceCreated
        );

        await deploymentManager.startDeployment(deploymentId);
        deploymentManager.updateDeploymentState(
          deploymentId,
          DeploymentState.Completed
        );
      } catch (err) {
        console.error(`Error during deployment process:`, err);
        deploymentManager.updateDeploymentState(
          deploymentId,
          DeploymentState.Failed
        );
      }
    })(); // Immediately Invoked Async Function
  } catch (err) {
    console.error(`Error starting deployment:`, err);
    res.status(500).json({ error: 'Failed to create deployment.' });
  }
});

wss.on('connection', async (ws: WebSocket, req) => {
  const deploymentId = req.url?.substring(1);

  if (!deploymentId || !deploymentManager.getDeployment(deploymentId)) {
    ws.close(1008, 'Invalid Deployment ID');
    return;
  }

  console.log(`WebSocket connected for deployment ID: ${deploymentId}`);

  const deployment = await deploymentManager.getDeployment(deploymentId);

  if (!deployment) {
    ws.close(1008, 'Deployment not found');
    return;
  }

  if (!connections.has(deploymentId)) {
    connections.set(deploymentId, new Set());
  }

  connections.get(deploymentId)?.add(ws);

  // Send the current deployment status
  if (ws.readyState === WebSocket.OPEN && deployment) {
    ws.send(JSON.stringify(deployment));
  }

  ws.on('close', () => {
    console.log(`WebSocket closed for deployment ID: ${deploymentId}`);
    connections.get(deploymentId)?.delete(ws);
    if (connections.get(deploymentId)?.size === 0) {
      connections.delete(deploymentId);
    }
  });
});

export { app, server };

// Start the server if not in a test environment
if (require.main === module) {
  server.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
  });
}
