// frontend/progress.tsx

import { DeploymentState, DeploymentStatus } from 'data-types';
import React, { useEffect, useState } from 'react';

interface DeploymentProgressProps {
  deploymentId: string;
}

const DeploymentProgress: React.FC<DeploymentProgressProps> = ({
  deploymentId,
}) => {
  const [state, setState] = useState<string>(DeploymentState.Pending);
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);
  const [webSocket, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3001/${deploymentId}`);

    ws.onopen = () => {
      console.log('WebSocket connected.');
      setWs(ws);
    };

    ws.onmessage = (event) => {
      const data: DeploymentStatus = JSON.parse(event.data);

      setState(data.state);

      if (data.state === DeploymentState.Completed && data.details.serviceUrl) {
        setServiceUrl(data.details.serviceUrl);
      } else if (data.state === DeploymentState.Failed) {
        setServiceUrl(null); // Clear service URL on failure
      }
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
    <section>
      <fieldset className='flex-container'>
        <legend>
          <h2>Deployment Status</h2>
        </legend>
        <div className='form-primary'>
          <h3>Deployment ID: {deploymentId}</h3>
          <p>State: {state}</p>
          {serviceUrl && state === DeploymentState.Completed && (
            <p>
              Your application is ready! Access it here:{' '}
              <a
                href={serviceUrl}
                target='_blank'
                rel='noopener noreferrer'
                style={{ color: 'black' }}
              >
                {serviceUrl}
              </a>
            </p>
          )}
          {state === DeploymentState.Failed && (
            <p style={{ color: 'red' }}>Deployment failed. Please try again.</p>
          )}
        </div>
        {/* <div
            className={progress < 100 ? 'btgs-wave-loader-animation-inner' : ''}
          >
            <span id='purple-dot'></span>
            <span id='pink-dot'></span>
            <span id='blue-dot'></span>
          </div> */}
      </fieldset>
    </section>
  );
};

export default DeploymentProgress;
