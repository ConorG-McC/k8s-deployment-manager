import React, { useState } from 'react';
import DeploymentForm from './Components/DeploymentForm';
import './styles/common.css';
import './App.css'
import DeploymentProgress from './Components/DeploymentProgress';

function App(): React.ReactElement {
  const [deploymentId, setDeploymentId] = useState<string | null>(null);

  return (
    <div>
      <div className="demo-watermark bg-red"><p className="white">DEMO</p></div>
      <div className="navbar"><h1>Kubernetes Deployment Tracker</h1></div>
      <div className="build-info-watermark"><span>[version number]</span></div>
      {!deploymentId ? (
        <DeploymentForm onSubmit={setDeploymentId} />
      ) : (
        <DeploymentProgress deploymentId={deploymentId} />
      )}
    </div>
  );
}

export default App;
