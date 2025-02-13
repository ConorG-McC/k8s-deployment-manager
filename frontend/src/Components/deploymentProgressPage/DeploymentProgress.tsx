import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DeploymentState, DeploymentStateData } from 'data-types';
import ProgressBar from '../progressBar/ProgressBar';
import useDeploymentWebSocket from 'src/hooks/useDeploymentWebSocket';

interface DeploymentProgressProps {
  deploymentId: string;
}

const DeploymentProgress: React.FC<DeploymentProgressProps> = ({
  deploymentId,
}) => {
  const navigate = useNavigate();
  const { state, serviceUrl } = useDeploymentWebSocket(deploymentId);
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
                style={{ color: '#5414b3' }}
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
