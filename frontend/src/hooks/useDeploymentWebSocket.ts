import { useEffect, useRef, useState } from 'react';
import { DeploymentState, DeploymentStatus } from 'data-types';

const useDeploymentWebSocket = (deploymentId: string) => {
  const [state, setState] = useState<DeploymentState>(DeploymentState.Pending);
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!deploymentId) return;

    const ws = new WebSocket(`ws://localhost:3001/${deploymentId}`);
    wsRef.current = ws;

    ws.onopen = () => console.log('WebSocket connected.');
    ws.onmessage = (event) => {
      const data: DeploymentStatus = JSON.parse(event.data);
      setState(data.state);

      if (data.state === DeploymentState.Completed && data.details.serviceUrl) {
        setServiceUrl(data.details.serviceUrl);
      } else if (data.state === DeploymentState.Failed) {
        setServiceUrl(null);
      }
    };

    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onclose = () => console.log('WebSocket closed.');

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [deploymentId]);

  return { state, serviceUrl };
};

export default useDeploymentWebSocket;
