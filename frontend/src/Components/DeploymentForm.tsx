import { DeploymentDetails } from 'data-types';
import React, { useState } from 'react';

interface DeploymentFormProps {
  onSubmit: (deploymentId: string) => void;
}

const DeploymentForm: React.FC<DeploymentFormProps> = ({ onSubmit }) => {
  const [imageName, setImageName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [port, setPort] = useState('');
  const [replicas, setReplicas] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    if (!imageName || !serviceName || !port || replicas < 1) {
      setError('All fields are required and replicas must be at least 1.');
      setLoading(false);
      return;
    }

    try {
      const deploymentDetails: DeploymentDetails = {
        imageName,
        serviceName,
        port,
        replicas,
      };

      const response = await fetch('http://localhost:3001/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deploymentDetails),
      });

      if (!response.ok) {
        throw new Error('Failed to create deployment');
      }

      const { deploymentId } = await response.json();
      onSubmit(deploymentId);
    } catch (error) {
      console.error('Error submitting deployment:', error);
      setError('Failed to create deployment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Image Name:
        <input
          type='text'
          value={imageName}
          onChange={(e) => setImageName(e.target.value)}
          required
          aria-label='Image Name'
        />
      </label>
      <label>
        Service Name:
        <input
          type='text'
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          required
          aria-label='Service Name'
        />
      </label>
      <label>
        Port:
        <input
          type='number'
          value={port}
          onChange={(e) => setPort(e.target.value)}
          required
          aria-label='Port'
        />
      </label>
      <label>
        Replicas:
        <input
          type='number'
          value={replicas}
          onChange={(e) => setReplicas(+e.target.value)}
          required
          aria-label='Replicas'
          min='1'
        />
      </label>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type='submit' disabled={loading}>
        {loading ? 'Deploying...' : 'Deploy'}
      </button>
    </form>
  );
};

export default DeploymentForm;
