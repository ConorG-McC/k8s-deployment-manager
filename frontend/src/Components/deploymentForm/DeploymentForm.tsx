import { DeploymentDetails } from 'data-types';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDeployment } from 'src/services/apiService';
import { validateDeploymentDetails } from 'src/utils/validation';

interface DeploymentFormProps {
  onSubmit: (deploymentId: string) => void;
}

const DeploymentForm: React.FC<DeploymentFormProps> = ({ onSubmit }) => {
  const [imageName, setImageName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [namespace, setNamespace] = useState('');
  const [port, setPort] = useState<number>(0);
  const [replicas, setReplicas] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const deploymentDetails: DeploymentDetails = {
      imageName,
      serviceName,
      namespace,
      port,
      replicas,
    };

    const validationResult = validateDeploymentDetails(deploymentDetails);
    if (validationResult) {
      setError(validationResult);
      setLoading(false);
      return;
    }

    try {
      const { deploymentId } = await createDeployment(deploymentDetails);
      onSubmit(deploymentId);
      navigate(`/progress/${deploymentId}`);
    } catch (error) {
      console.error('Error submitting deployment:', error);
      setError('Failed to create deployment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <fieldset className='flex-container'>
        <legend>
          <h2>Deployment Form</h2>
        </legend>
        <form className='form-primary' onSubmit={handleSubmit}>
          <div className='form-line-item'>
            <label htmlFor='image-name-input'>
              Image Name
              <input
                id='image-name-input'
                type='text'
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
                required
                aria-label='Image Name'
              />
            </label>
          </div>
          <div className='form-line-item'>
            <label>
              Service Name
              <input
                type='text'
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                required
                aria-label='Service Name'
              />
            </label>
          </div>
          <div className='form-line-item'>
            <label>
              Namespace
              <input
                type='text'
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                required
                aria-label='Namespace'
              />
            </label>
          </div>
          <div className='form-line-item'>
            <label>
              Port
              <input
                type='number'
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                required
                aria-label='Port'
                min='1'
              />
            </label>
          </div>
          <div className='form-line-item'>
            <label>
              Replicas
              <input
                type='number'
                value={replicas}
                onChange={(e) => setReplicas(Number(e.target.value))}
                required
                aria-label='Replicas'
                min='1'
              />
            </label>
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div className='form-line-item buttons'>
            <button
              className='gs-btn-secondary'
              type='button'
              onClick={() => navigate('/')}
            >
              Back
            </button>
            <button className='gs-btn-primary' type='submit' disabled={loading}>
              {loading ? 'Validating...' : 'Deploy'}
            </button>
          </div>
        </form>
      </fieldset>
    </section>
  );
};

export default DeploymentForm;
