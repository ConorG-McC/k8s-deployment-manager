import { validateDeploymentDetails } from './validation';
import { DeploymentDetails } from 'data-types';

describe('validateDeploymentDetails', () => {
  const validDetails: DeploymentDetails = {
    imageName: 'my-image',
    serviceName: 'my-service',
    namespace: 'my-namespace',
    port: 8080,
    replicas: 3,
  };

  it('returns null when details are valid', () => {
    expect(validateDeploymentDetails(validDetails)).toBeNull();
  });

  it('returns an error when imageName is empty', () => {
    const details = { ...validDetails, imageName: '' };
    expect(validateDeploymentDetails(details)).toBe(
      'Image name is required and cannot be empty.'
    );
  });

  it('returns an error when imageName is only spaces', () => {
    const details = { ...validDetails, imageName: '    ' };
    expect(validateDeploymentDetails(details)).toBe(
      'Image name is required and cannot be empty.'
    );
  });

  it('returns an error when serviceName is empty', () => {
    const details = { ...validDetails, serviceName: '' };
    expect(validateDeploymentDetails(details)).toBe(
      'Service name is required and cannot be empty.'
    );
  });

  it('returns an error when serviceName is only spaces', () => {
    const details = { ...validDetails, serviceName: '   ' };
    expect(validateDeploymentDetails(details)).toBe(
      'Service name is required and cannot be empty.'
    );
  });

  it('returns an error when namespace is empty', () => {
    const details = { ...validDetails, namespace: '' };
    expect(validateDeploymentDetails(details)).toBe(
      'Namespace is required and cannot be empty.'
    );
  });

  it('returns an error when namespace is only spaces', () => {
    const details = { ...validDetails, namespace: '  ' };
    expect(validateDeploymentDetails(details)).toBe(
      'Namespace is required and cannot be empty.'
    );
  });

  it('returns an error when port is less than 1', () => {
    const details = { ...validDetails, port: 0 };
    expect(validateDeploymentDetails(details)).toBe(
      'Port must be a number between 1 and 65535.'
    );
  });

  it('returns an error when port is greater than 65535', () => {
    const details = { ...validDetails, port: 70000 };
    expect(validateDeploymentDetails(details)).toBe(
      'Port must be a number between 1 and 65535.'
    );
  });

  it('returns an error when port is not a number', () => {
    const details = { ...validDetails, port: 'not-a-number' as any };
    expect(validateDeploymentDetails(details)).toBe(
      'Port must be a number between 1 and 65535.'
    );
  });

  it('returns an error when replicas is not an integer', () => {
    const details = { ...validDetails, replicas: 2.5 };
    expect(validateDeploymentDetails(details)).toBe(
      'Replicas must be a positive integer.'
    );
  });

  it('returns an error when replicas is less than 1', () => {
    const details = { ...validDetails, replicas: 0 };
    expect(validateDeploymentDetails(details)).toBe(
      'Replicas must be a positive integer.'
    );
  });
});
