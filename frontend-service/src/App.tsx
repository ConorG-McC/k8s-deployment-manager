import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Form from './components/Form';
import Progress from './components/Progress';
import StatusMessage from './components/StatusMessage';
import DeployedAppLink from './components/DeployedAppLink';

const App: React.FC = () => {
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>(
    'info'
  );
  const [isDeploying, setIsDeploying] = useState(false);
  const [appUrl, setAppUrl] = useState('');
  const [currentStage, setCurrentStage] = useState(0);
  const [errorStage, setErrorStage] = useState<number | null>(null);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  const stages = [
    'Starting Deployment',
    'Pulling Image',
    'Creating Deployment',
    'Setting Up Service',
    'Finalizing Deployment',
    'Completed',
  ];

  useEffect(() => {
    if (!deploymentId) return;

    let eventSource: EventSource | null = null;

    const connect = () => {
      eventSource = new EventSource(
        `${BACKEND_URL}/api/deploy/status/${deploymentId}`
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setStatusMessage(data.status);
        setCurrentStage(data.stage);

        if (data.url) {
          setAppUrl(data.url);
        }

        if (data.complete) {
          setIsDeploying(false);
          setStatusType('success');
          eventSource?.close();
        } else {
          setStatusType('info');
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setErrorStage(currentStage + 1);
        setStatusMessage('Deployment failed. Please try again.');
        setStatusType('error');
        setIsDeploying(false);
        eventSource?.close();
      };
    };

    connect();

    // Cleanup function to close SSE connection
    return () => {
      eventSource?.close();
    };
  }, [deploymentId, BACKEND_URL, currentStage]);

  const handleDeploy = async (formData: {
    imageName: string;
    serviceName: string;
    port: string;
    replicas: number;
  }) => {
    const { imageName, serviceName, port, replicas } = formData;
    setStatusMessage('');
    setStatusType('info');
    setErrorStage(null);

    // Validate form data
    if (!imageName || !serviceName || !port) {
      setStatusMessage('All fields except Replicas are required.');
      setStatusType('error');
      return;
    }
    if (Number(port) < 1 || Number(port) > 65535) {
      setStatusMessage('Port must be between 1 and 65535.');
      setStatusType('error');
      return;
    }

    setIsDeploying(true);
    setStatusMessage('Starting deployment...');
    setStatusType('info');
    setAppUrl('');
    setCurrentStage(1);

    try {
      // Start the deployment and get deploymentId
      const response = await axios.post(`${BACKEND_URL}/api/deploy`, {
        imageName,
        resourceDetails: {
          serviceName,
          port: parseInt(port),
          replicas: parseInt(String(replicas)),
        },
      });

      const { deploymentId } = response.data;
      setDeploymentId(deploymentId);
    } catch (error: any) {
      setErrorStage(currentStage + 1);
      const errorMsg =
        error.response?.data?.error ||
        'Deployment failed. Please check the details and try again.';
      setStatusMessage(errorMsg);
      setStatusType('error');
      console.error('Deployment error:', error);
      setIsDeploying(false);
      setCurrentStage(0); // Reset on error
    }
  };

  return (
    <div className='App'>
      <h1>Deploy Your Application</h1>
      <Form onSubmit={handleDeploy} isDeploying={isDeploying} />
      {statusMessage && (
        <StatusMessage message={statusMessage} type={statusType} />
      )}
      {isDeploying && (
        <Progress
          stages={stages}
          currentStage={currentStage}
          errorStage={errorStage}
        />
      )}
      {appUrl && <DeployedAppLink appUrl={appUrl} />}
    </div>
  );
};

export default App;
