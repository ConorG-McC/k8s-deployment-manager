import { DeploymentDetails } from 'data-types';

export const validateDeploymentDetails = (
  details: DeploymentDetails
): string | null => {
  const { imageName, serviceName, namespace, port, replicas } = details;

  if (!imageName || imageName.trim() === '') {
    return 'Image name is required and cannot be empty.';
  }

  if (!serviceName || serviceName.trim() === '') {
    return 'Service name is required and cannot be empty.';
  }

  if (!namespace || namespace.trim() === '') {
    return 'Namespace is required and cannot be empty.';
  }

  if (typeof port !== 'number' || port < 1 || port > 65535) {
    return 'Port must be a number between 1 and 65535.';
  }

  if (!Number.isInteger(replicas) || replicas < 1) {
    return 'Replicas must be a positive integer.';
  }

  return null; // No errors
};
