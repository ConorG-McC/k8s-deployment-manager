import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders the DeploymentForm initially', () => {
    render(<App />);
    expect(
      screen.getByText('Kubernetes Deployment Tracker')
    ).toBeInTheDocument();
    expect(screen.getByText('Deployment Form')).toBeInTheDocument(); // From real DeploymentForm
  });
});
