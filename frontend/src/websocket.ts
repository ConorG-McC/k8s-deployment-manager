import { useEffect, useState } from 'react';

let websocket: WebSocket | null = null;

export const useWebSocket = (
  websocketUrl: string,
  onMessage: (data: any) => void
) => {
  useEffect(() => {
    websocket = new WebSocket(websocketUrl);

    websocket.onopen = () => {
      console.log('WebSocket connection opened.');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    websocket.onclose = () => {
      console.log('WebSocket connection closed. Reconnecting...');
      // Attempt to reconnect after a delay
      setTimeout(() => {
        useWebSocket(websocketUrl, onMessage);
      }, 5000);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      websocket?.close();
    };

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [websocketUrl, onMessage]);
};

export const sendWebSocketMessage = (message: any) => {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(message));
  } else {
    console.error('WebSocket is not open. Cannot send message.');
  }
};
