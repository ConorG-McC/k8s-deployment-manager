import React, { useState } from 'react';
import DeploymentForm from './components/deploymentForm/DeploymentForm';
import './styles/common.css';
import './App.css';
import DeploymentProgress from './components/deploymentProgressPage/DeploymentProgress';
import { Route, Routes } from 'react-router-dom';
import HomePage from './components/homePage/HomePage';

function App(): React.ReactElement {
  const [deploymentId, setDeploymentId] = useState<string | null>(null);

  return (
    <div>
      <div className='demo-watermark bg-red'>
        <p className='white'>DEMO</p>
      </div>
      <div className='navbar'>
        <h1>Kubernetes Deployment Tracker</h1>
      </div>
      <div className='build-info-watermark'>
        <span>[version number]</span>
      </div>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route
          path='/deploy'
          element={<DeploymentForm onSubmit={setDeploymentId} />}
        />
        <Route
          path='/progress/:deploymentId'
          element={
            deploymentId ? (
              <DeploymentProgress deploymentId={deploymentId} />
            ) : (
              <div>Loading...</div>
            )
          }
        />
        {/* Add a fallback route for undefined paths */}
        <Route path='*' element={<HomePage />} />
      </Routes>
    </div>
  );
}

export default App;
