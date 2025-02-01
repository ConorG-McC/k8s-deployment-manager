import express, { Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { DeploymentManager } from './services/deploymentManager';
import { WebSocketManager } from './services/websocketManager';
import { DeploymentDetails, DeploymentStatus } from 'data-types';

const app = express();
const server = new HttpServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

const webSocketManager = new WebSocketManager();
const deploymentManager = new DeploymentManager({ simulateDelays: true });

deploymentManager.on(
  'stateChange',
  (deploymentId: string, deploymentStatus: DeploymentStatus) => {
    webSocketManager.broadcast(deploymentId, deploymentStatus);
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

    res.json({ deploymentId });

    deploymentManager
      .handleDeployment(deploymentId, {
        imageName,
        serviceName,
        namespace,
        port,
        replicas,
      })
      .catch((err: any) => {
        console.error(`Deployment process for ID ${deploymentId} failed:`, err);
      });
  } catch (err) {
    console.error(`Error starting deployment:`, err);
    res.status(500).json({ error: err });
  }
});

wss.on('connection', async (ws: WebSocket, req) => {
  const deploymentId = req.url?.substring(1);

  if (!deploymentId || !deploymentManager.getDeployment(deploymentId)) {
    ws.close(1008, 'Invalid Deployment ID');
    return;
  }

  console.log(`WebSocket connected for deployment ID: ${deploymentId}`);

  const deployment = deploymentManager.getDeployment(deploymentId);

  if (!deployment) {
    ws.close(1008, 'Deployment not found');
    return;
  }

  webSocketManager.addConnection(deploymentId, ws);

  if (ws.readyState === WebSocket.OPEN && deployment) {
    ws.send(JSON.stringify(deployment));
  }

  ws.on('close', () => {
    console.log(`WebSocket closed for deployment ID: ${deploymentId}`);
    webSocketManager.removeConnection(deploymentId, ws);
  });
});

export { app, server };

// Start the server if not in a test environment
if (require.main === module) {
  server.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
  });
}
