import { DeploymentDetails } from 'data-types';

const API_URL = 'http://localhost:3001';

export const createDeployment = async (
  deploymentDetails: DeploymentDetails
) => {
  const response = await fetch(`${API_URL}/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deploymentDetails),
  });

  if (!response.ok) {
    throw new Error('Failed to create deployment');
  }

  return await response.json();
};
