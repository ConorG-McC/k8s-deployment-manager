import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import DeploymentForm from './DeploymentForm';
import { DeploymentIdContextProvider } from '../../hooks/useDeploymentIdContext';
import { createDeployment } from '../../services/apiService';

jest.mock('../../services/apiService', () => ({
  createDeployment: jest.fn(),
}));

describe('DeploymentForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the DeploymentForm correctly', () => {
    render(
      <MemoryRouter>
        <DeploymentIdContextProvider>
          <DeploymentForm />
        </DeploymentIdContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Image Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Service Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Namespace')).toBeInTheDocument();
    expect(screen.getByLabelText('Port')).toBeInTheDocument();
    expect(screen.getByLabelText('Replicas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deploy/i })).toBeInTheDocument();
  });

  it('updates input fields correctly', () => {
    render(
      <MemoryRouter>
        <DeploymentIdContextProvider>
          <DeploymentForm />
        </DeploymentIdContextProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Image Name'), {
      target: { value: 'my-image' },
    });
    fireEvent.change(screen.getByLabelText('Service Name'), {
      target: { value: 'my-service' },
    });
    fireEvent.change(screen.getByLabelText('Namespace'), {
      target: { value: 'my-namespace' },
    });
    fireEvent.change(screen.getByLabelText('Port'), {
      target: { value: '8080' },
    });
    fireEvent.change(screen.getByLabelText('Replicas'), {
      target: { value: '3' },
    });

    expect(screen.getByLabelText('Image Name')).toHaveValue('my-image');
    expect(screen.getByLabelText('Service Name')).toHaveValue('my-service');
    expect(screen.getByLabelText('Namespace')).toHaveValue('my-namespace');
    expect(screen.getByLabelText('Port')).toHaveValue(8080);
    expect(screen.getByLabelText('Replicas')).toHaveValue(3);
  });

  it('submits the form and calls createDeployment', async () => {
    (createDeployment as jest.Mock).mockResolvedValue({
      deploymentId: 'test-deployment-id',
    });

    render(
      <MemoryRouter>
        <DeploymentIdContextProvider>
          <DeploymentForm />
        </DeploymentIdContextProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Image Name'), {
      target: { value: 'my-image' },
    });
    fireEvent.change(screen.getByLabelText('Service Name'), {
      target: { value: 'my-service' },
    });
    fireEvent.change(screen.getByLabelText('Namespace'), {
      target: { value: 'my-namespace' },
    });
    fireEvent.change(screen.getByLabelText('Port'), {
      target: { value: '8080' },
    });
    fireEvent.change(screen.getByLabelText('Replicas'), {
      target: { value: '3' },
    });

    fireEvent.click(screen.getByRole('button', { name: /deploy/i }));

    await waitFor(() => {
      expect(createDeployment).toHaveBeenCalledWith({
        imageName: 'my-image',
        serviceName: 'my-service',
        namespace: 'my-namespace',
        port: 8080,
        replicas: 3,
      });
    });
  });

  it('displays an error message if createDeployment fails', async () => {
    (createDeployment as jest.Mock).mockRejectedValue(
      new Error('Failed to create deployment')
    );

    render(
      <MemoryRouter>
        <DeploymentIdContextProvider>
          <DeploymentForm />
        </DeploymentIdContextProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Image Name'), {
      target: { value: 'my-image' },
    });
    fireEvent.change(screen.getByLabelText('Service Name'), {
      target: { value: 'my-service' },
    });
    fireEvent.change(screen.getByLabelText('Namespace'), {
      target: { value: 'my-namespace' },
    });
    fireEvent.change(screen.getByLabelText('Port'), {
      target: { value: '8080' },
    });
    fireEvent.change(screen.getByLabelText('Replicas'), {
      target: { value: '1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /deploy/i }));

    expect(
      await screen.findByText(/Failed to create deployment/i)
    ).toBeInTheDocument();
  });
});
