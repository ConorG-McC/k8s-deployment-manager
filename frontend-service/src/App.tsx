import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Form from './components/Form';
import Progress from './components/Progress';
import DeployedAppLink from './components/DeployedAppLink';
import { StatusMessageTypes, StatusMessages } from './enum/Enums';
import StatusMessage from './components/StatusMessage';

const App: React.FC = () => {
  const [statusMessage, setStatusMessage] = useState<StatusMessages>(
    StatusMessages.None
  );
  const [statusType, setStatusType] = useState<StatusMessageTypes>(
    StatusMessageTypes.Info
  );
  const [isDeploying, setIsDeploying] = useState(false);
  const [appUrl, setAppUrl] = useState('');
  const [currentStage, setCurrentStage] = useState(0);
  const [errorStage, setErrorStage] = useState<number | null>(null);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

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
          setStatusType(StatusMessageTypes.Success);
          eventSource?.close();
        } else {
          setStatusType(StatusMessageTypes.Info);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setErrorStage(currentStage + 1);
        setStatusMessage(StatusMessages.DeploymentFailed);
        setStatusType(StatusMessageTypes.Error);
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
    setStatusMessage(StatusMessages.None);
    setStatusType(StatusMessageTypes.Info);
    setErrorStage(null);

    // Validate form data
    if (!imageName || !serviceName || !port) {
      setStatusMessage(StatusMessages.RequiredFields);
      setStatusType(StatusMessageTypes.Error);
      return;
    }
    if (Number(port) < 1 || Number(port) > 65535) {
      setStatusMessage(StatusMessages.PortRange);
      setStatusType(StatusMessageTypes.Error);
      return;
    }

    setIsDeploying(true);
    setStatusMessage(StatusMessages.DeploymentStarted);
    setStatusType(StatusMessageTypes.Info);
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
        error.response?.data?.error || StatusMessages.DeploymentFailed;
      setStatusMessage(errorMsg);
      setStatusType(StatusMessageTypes.Error);
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
        <Progress currentStage={currentStage} errorStage={errorStage} />
      )}
      {appUrl && <DeployedAppLink appUrl={appUrl} />}
    </div>
  );
};

export default App;
