import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleStartDeployment = () => {
    navigate('/deploy');
  };

  return (
    <section>
      <fieldset className='flex-container'>
        <legend>
          <h2>Welcome to Kubernetes Deployment Tracker</h2>
        </legend>
        <form className='form-primary'>
          <div className='form-line-item'>
            <div>Track and manage your Kubernetes deployments with ease.</div>
          </div>

          <div className='form-line-item'>
            <button className='gs-btn-primary' onClick={handleStartDeployment}>
              Start Deployment
            </button>
          </div>
        </form>
      </fieldset>
    </section>
  );
};

export default HomePage;
