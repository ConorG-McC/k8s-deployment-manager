import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  try {
    if (!connectionId) {
      throw new Error('ConnectionId missing.');
    }
    return { statusCode: 200, body: 'Disconnected.' };
  } catch (error) {
    console.error('Disconnect Error:', error);
    return { statusCode: 500, body: 'Failed to disconnect.' };
  }
};
