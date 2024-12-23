import { DeploymentState, DeploymentStatus } from 'data-types';
import React, { useEffect, useState } from 'react';

interface DeploymentProgressProps {
  deploymentId: string;
}

const DeploymentProgress: React.FC<DeploymentProgressProps> = ({
  deploymentId,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [state, setState] = useState<string>('Pending');
  const [webSocket, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3001/${deploymentId}`);

    ws.onopen = () => {
      console.log('WebSocket connected.');
      setWs(ws);
    };

    ws.onmessage = (event) => {
      const data: DeploymentStatus = JSON.parse(event.data);
      setProgress(data.progress);
      setState(data.state);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed.');
    };

    return () => {
      console.log('Cleaning up WebSocket connection...');
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      } else {
        console.log('WebSocket already closed.');
      }
    };
  }, [deploymentId]);

  useEffect(() => {
    if (
      (webSocket && state === DeploymentState.Completed) ||
      state === DeploymentState.Failed
    ) {
      console.log('Closing WebSocket...');
      webSocket?.close();
    }
  }, [state, webSocket]);

  return (
    <div>
      <h2>Deployment ID: {deploymentId}</h2>
      <p>State: {state}</p>
      <p>Progress: {progress}%</p>
    </div>
  );
};

export default DeploymentProgress;
