import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DeploymentState,
  DeploymentStatus,
  DeploymentStateData,
} from 'data-types';
import ProgressBar from '../progressBar/ProgressBar';

interface DeploymentProgressProps {
  deploymentId: string;
}

const DeploymentProgress: React.FC<DeploymentProgressProps> = ({
  deploymentId,
}) => {
  const [state, setState] = useState<DeploymentState>(DeploymentState.Pending);
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!deploymentId) {
      navigate('/');
      return;
    }

    const ws = new WebSocket(`ws://localhost:3001/${deploymentId}`);
    wsRef.current = ws;

    ws.onopen = () => console.log('WebSocket connected.');
    ws.onmessage = (event) => {
      const data: DeploymentStatus = JSON.parse(event.data);
      setState(data.state);

      if (data.state === DeploymentState.Completed && data.details.serviceUrl) {
        setServiceUrl(data.details.serviceUrl);
      } else if (data.state === DeploymentState.Failed) {
        setServiceUrl(null); // Clear service URL on failure
      }
    };
    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onclose = () => console.log('WebSocket closed.');

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [deploymentId, navigate]);

  useEffect(() => {
    if (
      state === DeploymentState.Completed ||
      state === DeploymentState.Failed
    ) {
      wsRef.current?.close();
    }
  }, [state]);

  const handleBack = () => navigate('/');
  const handleDeployAnother = () => navigate('/deploy');

  const currentStepData = DeploymentStateData[state];
  const progressPercentage = currentStepData?.percentage ?? 0;
  const variant = currentStepData?.variant ?? 'primary';

  return (
    <section className='deployment-progress'>
      <fieldset className='flex-container'>
        <legend>
          <h2>Deployment Status</h2>
        </legend>
        <div className='form-primary'>
          <h3>Deployment ID: {deploymentId}</h3>
          <p>
            Current State: <strong>{state}</strong>
          </p>

          <ProgressBar
            progress={progressPercentage}
            variant={variant}
            label={state}
          />

          {serviceUrl && state === DeploymentState.Completed && (
            <p>
              Your application is ready! Access it{' '}
              <a
                href={serviceUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='service-link'
              >
                here
              </a>
              .
            </p>
          )}
          {state === DeploymentState.Failed && (
            <p className='error-message'>
              Deployment failed. Please try again.
            </p>
          )}
        </div>
        <div className='buttons'>
          <button className='gs-btn-secondary' onClick={handleBack}>
            Back
          </button>
          {(state === DeploymentState.Completed ||
            state === DeploymentState.Failed) && (
            <button className='gs-btn-primary' onClick={handleDeployAnother}>
              {state === DeploymentState.Completed
                ? 'Deploy Another'
                : 'Retry Deployment'}
            </button>
          )}
        </div>
      </fieldset>
    </section>
  );
};

export default DeploymentProgress;
