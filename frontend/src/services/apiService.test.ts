import { createDeployment } from './apiService';

describe('createDeployment', () => {
  const fakeDeploymentDetails = {
    imageName: 'my-image',
    serviceName: 'my-service',
    namespace: 'my-namespace',
    port: 8080,
    replicas: 3,
  };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends a POST request with correct headers and body, and returns JSON on success', async () => {
    const fakeResponseData = { deploymentId: 'test-deployment-id' };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(fakeResponseData),
    });

    const result = await createDeployment(fakeDeploymentDetails);

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fakeDeploymentDetails),
    });
    expect(result).toEqual(fakeResponseData);
  });

  it('throws an error when the response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    await expect(createDeployment(fakeDeploymentDetails)).rejects.toThrow(
      'Failed to create deployment'
    );
  });
});
