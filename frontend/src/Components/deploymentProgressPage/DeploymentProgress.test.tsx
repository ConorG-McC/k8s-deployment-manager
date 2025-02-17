import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import DeploymentProgress from './DeploymentProgress';
import { useDeploymentIdContext } from '../../hooks/useDeploymentIdContext';
import useDeploymentWebSocket from '../../hooks/useDeploymentWebSocket';
import { useNavigate } from 'react-router-dom';
import { DeploymentState } from 'data-types';

jest.mock('../../hooks/useDeploymentIdContext');
jest.mock('../../hooks/useDeploymentWebSocket');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('DeploymentProgress Component', () => {
  const mockDeploymentId = 'test-deployment-id';

  beforeEach(() => {
    (useDeploymentIdContext as jest.Mock).mockReturnValue({
      deploymentId: mockDeploymentId,
    });
  });

  it('renders the DeploymentProgress component correctly', () => {
    (useDeploymentWebSocket as jest.Mock).mockReturnValue({
      state: DeploymentState.Pending,
      serviceUrl: null,
    });

    render(
      <MemoryRouter>
        <DeploymentProgress />
      </MemoryRouter>
    );

    expect(screen.getByText(/Deployment Status/i)).toBeInTheDocument();
    expect(
      screen.getByText(`Deployment ID: ${mockDeploymentId}`)
    ).toBeInTheDocument();
  });

  it('displays the progress bar with the correct state', () => {
    (useDeploymentWebSocket as jest.Mock).mockReturnValue({
      state: DeploymentState.Validating,
      serviceUrl: null,
    });

    render(
      <MemoryRouter>
        <DeploymentProgress />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Validating Deployment Details/i, {
        selector: 'span.progress-label',
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays a success message when deployment is completed', async () => {
    (useDeploymentWebSocket as jest.Mock).mockReturnValue({
      state: DeploymentState.Completed,
      serviceUrl: 'http://example.com',
    });

    render(
      <MemoryRouter>
        <DeploymentProgress />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Completed/i, { selector: 'span.progress-label' })
    ).toBeInTheDocument();

    const link = await screen.findByRole('link', { name: /here/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'http://example.com');

    await waitFor(() => {
      expect(
        screen.getByText(
          (content, element) =>
            content.includes('Your application is ready!') &&
            element?.tagName.toLowerCase() === 'p'
        )
      ).toBeInTheDocument();
    });
  });

  it('displays an error message when deployment fails', async () => {
    (useDeploymentWebSocket as jest.Mock).mockReturnValue({
      state: DeploymentState.Failed,
      serviceUrl: null,
    });

    render(
      <MemoryRouter>
        <DeploymentProgress />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          (content, element) =>
            content.includes('Deployment failed. Please try again.') &&
            element?.tagName.toLowerCase() === 'p'
        )
      ).toBeInTheDocument();
    });
  });

  it('navigates back when Back button is clicked', () => {
    const mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useDeploymentWebSocket as jest.Mock).mockReturnValue({
      state: DeploymentState.Pending,
      serviceUrl: null,
    });

    render(
      <MemoryRouter>
        <DeploymentProgress />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to deploy another when button is clicked', () => {
    const mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useDeploymentWebSocket as jest.Mock).mockReturnValue({
      state: DeploymentState.Completed,
      serviceUrl: 'http://example.com',
    });

    render(
      <MemoryRouter>
        <DeploymentProgress />
      </MemoryRouter>
    );

    // Query for the deploy button by its text content.
    const deployButton = screen.getByText('Deploy Another');
    expect(deployButton).toBeInTheDocument();
    fireEvent.click(deployButton);
    expect(mockNavigate).toHaveBeenCalledWith('/deploy');
  });
});
