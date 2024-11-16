import express, { Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { DeploymentManager } from './services/deploymentManager';
import { DeploymentDetails } from 'data-types';

// Create Express app and HTTP server
const app = express();
const server = new HttpServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json()); // Ensures req.body is parsed

// Instantiate DeploymentManager
const deploymentManager = new DeploymentManager();

// Define the POST /deploy endpoint
app.post('/deploy', (req: Request, res: Response): void => {
  const { imageName, serviceName, port, replicas }: DeploymentDetails =
    req.body;

  if (!imageName || !serviceName || !port || replicas < 1) {
    res.status(400).json({ error: 'Invalid deployment details' });
    return;
  }

  const deploymentId = deploymentManager.addDeployment(imageName);
  console.log(`Deployment created: ${deploymentId}`);

  res.json({ deploymentId });
});

// WebSocket handling for deployment progress
wss.on('connection', (ws: WebSocket, req) => {
  const deploymentId = req.url?.substring(1);

  if (!deploymentId || !deploymentManager.getDeployment(deploymentId)) {
    ws.close(1008, 'Invalid Deployment ID');
    return;
  }

  console.log(`WebSocket connected for deployment ID: ${deploymentId}`);

  const interval = setInterval(() => {
    const deployment = deploymentManager.updateProgress(deploymentId);

    if (!deployment) {
      clearInterval(interval);
      ws.close(1008, 'Deployment not found');
      return;
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(deployment));

      if (deployment.state === 'Completed') {
        clearInterval(interval);
      }
    }
  }, 1000);

  ws.on('close', () => {
    console.log(`WebSocket closed for deployment ID: ${deploymentId}`);
    clearInterval(interval);
  });
});

// Start the server
server.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});