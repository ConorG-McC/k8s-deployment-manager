import React, { useState } from 'react';

interface DeploymentFormProps {
  connectionId: string;
  restApiUrl: string;
  onStatusUpdate: (status: string) => void;
}

const DeploymentForm: React.FC<DeploymentFormProps> = ({
  connectionId,
  restApiUrl,
  onStatusUpdate,
}) => {
  const [imageName, setImageName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [port, setPort] = useState(80);
  const [replicas, setReplicas] = useState(1);
  const [status, setStatus] = useState('');
  const [deploymentId, setDeploymentId] = useState('');

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectionId) {
      alert('WebSocket connection not established. Please try again.');
      return;
    }

    const payload = {
      imageName,
      serviceName,
      port: parseInt(port.toString()),
      replicas: parseInt(replicas.toString()),
      connectionId,
    };

    try {
      const response = await fetch(`${restApiUrl}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setDeploymentId(data.deploymentId);
        setStatus('Deployment Started');
        onStatusUpdate('Deployment Started');
      } else {
        setStatus(`Error: ${data.error}`);
        onStatusUpdate(`Error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Deployment Error:', error);
      setStatus('Deployment Failed');
      onStatusUpdate('Deployment Failed');
    }
  };

  return (
    <div>
      <h2>Deploy Application</h2>
      <form onSubmit={handleDeploy}>
        <div>
          <label>Image Name:</label>
          <input
            type='text'
            value={imageName}
            onChange={(e) => setImageName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Service Name:</label>
          <input
            type='text'
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Port:</label>
          <input
            type='number'
            value={port}
            onChange={(e) => setPort(parseInt(e.target.value))}
            required
          />
        </div>
        <div>
          <label>Replicas:</label>
          <input
            type='number'
            value={replicas}
            onChange={(e) => setReplicas(parseInt(e.target.value))}
            required
          />
        </div>
        <button type='submit' disabled={!connectionId}>
          Deploy
        </button>
      </form>

      <div>
        <h3>Deployment Status:</h3>
        <p>{status}</p>
        {deploymentId && <p>Deployment ID: {deploymentId}</p>}
      </div>
    </div>
  );
};

export default DeploymentForm;
