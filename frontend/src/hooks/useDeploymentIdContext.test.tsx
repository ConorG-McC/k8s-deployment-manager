// DeploymentIdContext.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  DeploymentIdContextProvider,
  useDeploymentIdContext,
} from './useDeploymentIdContext';

const ConsumerComponent: React.FC = () => {
  const { deploymentId, setDeploymentId } = useDeploymentIdContext();
  return (
    <div>
      <span data-testid='deployment-id'>
        deploymentId: {deploymentId || 'null'}
      </span>
      <button onClick={() => setDeploymentId('test-id')}>Set ID</button>
    </div>
  );
};

describe('DeploymentIdContextProvider and useDeploymentIdContext', () => {
  it('provides a default value and allows updating the deploymentId', () => {
    render(
      <DeploymentIdContextProvider>
        <ConsumerComponent />
      </DeploymentIdContextProvider>
    );
    expect(screen.getByTestId('deployment-id')).toHaveTextContent(
      'deploymentId: null'
    );

    fireEvent.click(screen.getByText('Set ID'));
    expect(screen.getByTestId('deployment-id')).toHaveTextContent(
      'deploymentId: test-id'
    );
  });

  it('throws an error when used outside the provider', () => {
    const ConsumerWithoutProvider: React.FC = () => {
      useDeploymentIdContext();
      return <div>Consumer</div>;
    };

    expect(() => render(<ConsumerWithoutProvider />)).toThrow(
      'useDeployment must be used within a DeploymentProvider'
    );
  });
});
