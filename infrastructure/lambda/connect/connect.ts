import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';

export const handler: APIGatewayProxyHandler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  try {
    if (!connectionId) {
      throw new Error('ConnectionId missing.');
    }
    // Send the connectionId back to the client
    const message = { connectionId };
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
      endpoint:
        event.requestContext.domainName + '/' + event.requestContext.stage,
    });

    await apigwManagementApi
      .postToConnection({
        Data: JSON.stringify(message),
        ConnectionId: connectionId,
      })
      .promise();

    return { statusCode: 200, body: 'Connected.' };
  } catch (error) {
    console.error('Connect Error:', error);
    return { statusCode: 500, body: 'Failed to connect.' };
  }
};
