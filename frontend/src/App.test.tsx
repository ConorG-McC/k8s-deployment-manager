import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { DeploymentIdContextProvider } from './hooks/useDeploymentIdContext';

jest.mock('./components/homePage/HomePage', () => () => (
  <div data-testid='home-page'>HomePage</div>
));

jest.mock('./components/deploymentForm/DeploymentForm', () => {
  return ({ onSubmit }: { onSubmit: (id: string) => void }) => (
    <div data-testid='deployment-form'>
      Deployment Form
      <button onClick={() => onSubmit('test-deployment-id')}>Submit</button>
    </div>
  );
});

jest.mock(
  './components/deploymentProgressPage/DeploymentProgress',
  () => () =>
    (
      <div data-testid='deployment-progress'>
        DeploymentProgress: {Math.random().toString(36).substring(7)}{' '}
      </div>
    )
);

describe('App Component', () => {
  it('renders the HomePage on initial load', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <DeploymentIdContextProvider>
          <App />
        </DeploymentIdContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(
      screen.getByText('Kubernetes Deployment Manager')
    ).toBeInTheDocument();
    expect(screen.getByText('DEMO')).toBeInTheDocument();
  });

  it('renders the DeploymentForm when navigating to /deploy', () => {
    render(
      <MemoryRouter initialEntries={['/deploy']}>
        <DeploymentIdContextProvider>
          <App />
        </DeploymentIdContextProvider>
      </MemoryRouter>
    );

    // Assert that the form is visible
    expect(screen.getByTestId('deployment-form')).toBeInTheDocument();
    expect(screen.getByText('Deployment Form')).toBeInTheDocument();
  });

  it('renders "Loading..." on /progress/:deploymentId when deploymentId is not set', () => {
    render(
      <MemoryRouter initialEntries={['/progress/test-deployment-id']}>
        <DeploymentIdContextProvider>
          <App />
        </DeploymentIdContextProvider>
      </MemoryRouter>
    );

    // Since deploymentId is null initially, the fallback should show
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders HomePage for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <DeploymentIdContextProvider>
          <App />
        </DeploymentIdContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });
});
