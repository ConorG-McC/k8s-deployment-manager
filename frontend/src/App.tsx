import React, { useState } from 'react';
import DeploymentForm from './Components/DeploymentForm';
import DeploymentProgress from './Components/DeploymentProgress';

function App(): React.ReactElement {
  const [deploymentId, setDeploymentId] = useState<string | null>(null);

  return (
    <div>
      <h1>Kubernetes Deployment Tracker</h1>
      {!deploymentId ? (
        <DeploymentForm onSubmit={setDeploymentId} />
      ) : (
        <DeploymentProgress deploymentId={deploymentId} />
      )}
    </div>
  );
}

export default App;
