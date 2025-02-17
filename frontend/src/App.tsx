import React from 'react';
import DeploymentForm from './components/deploymentForm/DeploymentForm';
import './styles/common.css';
import './App.css';
import DeploymentProgress from './components/deploymentProgressPage/DeploymentProgress';
import { Route, Routes } from 'react-router-dom';
import HomePage from './components/homePage/HomePage';
import { useDeploymentIdContext } from './hooks/useDeploymentIdContext';

function App(): React.ReactElement {
  const releaseTag = process.env.RELEASE_TAG || 'development';
  const { deploymentId } = useDeploymentIdContext();

  return (
    <div>
      <div className='demo-watermark bg-red'>
        <p className='white'>DEMO</p>
      </div>
      <div className='navbar'>
        <h1>Kubernetes Deployment Manager</h1>
      </div>
      <div className='build-info-watermark'>
        <span>{releaseTag}</span>
      </div>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/deploy' element={<DeploymentForm />} />
        <Route
          path='/progress/:deploymentId'
          element={
            deploymentId ? <DeploymentProgress /> : <div>Loading...</div>
          }
        />
        <Route path='*' element={<HomePage />} />
      </Routes>
    </div>
  );
}

export default App;
