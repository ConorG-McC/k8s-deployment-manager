import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage';
import { useNavigate } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('HomePage Component', () => {
  it('renders the HomePage correctly', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Welcome to Kubernetes Deployment Tracker')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Track and manage your Kubernetes deployments with ease.'
      )
    ).toBeInTheDocument();
  });

  it('navigates to /deploy when Start Deployment button is clicked', () => {
    const mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

    render(
      <MemoryRouter initialEntries={['/']}>
        <HomePage />
      </MemoryRouter>
    );

    const startDeploymentButton = screen.getByText('Start Deployment');
    fireEvent.click(startDeploymentButton);

    expect(mockNavigate).toHaveBeenCalledWith('/deploy');
  });
});
