import React, { useEffect, useState } from 'react';
import DeploymentForm from './components/DeploymentForm';
import { useWebSocket } from './websocket';

function App() {
  const [connectionId, setConnectionId] = useState('');
  const [status, setStatus] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [deploymentId, setDeploymentId] = useState('');

  // Access the WebSocket and REST API URLs from environment variables
  const websocketUrl = process.env.REACT_APP_WEBSOCKET_URL || '';
  const restApiUrl = process.env.REACT_APP_REST_API_URL || '';

  const handleMessage = (data: any) => {
    if (data.connectionId) {
      setConnectionId(data.connectionId);
    }
    if (data.status) {
      setStatus(data.status);
    }
    if (data.appUrl) {
      setAppUrl(data.appUrl);
    }
    if (data.deploymentId) {
      setDeploymentId(data.deploymentId);
    }
  };

  useWebSocket(websocketUrl, handleMessage);

  return (
    <div className='App'>
      <h1>Deployment Manager</h1>
      <DeploymentForm
        connectionId={connectionId}
        onStatusUpdate={setStatus}
        restApiUrl={restApiUrl}
      />
      <div>
        <h3>Deployment Status:</h3>
        <p>{status}</p>
        {deploymentId && <p>Deployment ID: {deploymentId}</p>}
        {appUrl && (
          <p>
            Application URL:{' '}
            <a
              href={`http://${appUrl}`}
              target='_blank'
              rel='noopener noreferrer'
            >
              {`http://${appUrl}`}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
