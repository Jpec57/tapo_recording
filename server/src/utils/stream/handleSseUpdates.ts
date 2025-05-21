import { Request, Response } from 'express';
import { activeRecordings } from './sharedRecordingState';

export interface SseClient {
  id: string;
  res: Response; // The response object for this client's SSE connection
}

let sseClients: SseClient[] = [];

export const broadcastToSseClients = (
  data: any,
  eventName: string = 'recording_update'
) => {
  if (sseClients.length === 0) {
    return;
  }

  const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  console.log(
    `[SSE] Broadcasting '${eventName}' to ${sseClients.length} client(s). Data: ${JSON.stringify(
      data
    )}`
  );

  sseClients.forEach(client => {
    try {
      client.res.write(message);
    } catch (e) {
      console.error(`[SSE] Error writing to client ${client.id}. Removing.`, e);
      // Optionally remove client here if write fails, though 'close' should handle it
      sseClients = sseClients.filter(c => c.id !== client.id);
    }
  });
};
export const handleSseUpdates = (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
    // 'Access-Control-Allow-Origin': '*' // Uncomment if your client is on a different domain/port
  });
  res.write('\n'); // Send an initial newline

  const clientId =
    Date.now().toString() + Math.random().toString(36).substring(2);
  const newClient: SseClient = { id: clientId, res };
  sseClients.push(newClient);
  console.log(
    `[SSE] Client ${clientId} connected. Total clients: ${sseClients.length}`
  );

  // Send current status immediately on connection
  const currentStatus = {
    type: 'initial_status', // Custom type for the initial message
    active: Array.from(activeRecordings.keys()),
    count: activeRecordings.size
  };
  // Use a specific event name for initial status for clarity on client-side
  res.write(
    `event: initial_status\ndata: ${JSON.stringify(currentStatus)}\n\n`
  );

  req.on('close', () => {
    console.log(`[SSE] Client ${clientId} disconnected.`);
    sseClients = sseClients.filter(client => client.id !== clientId);
    console.log(`[SSE] Total clients remaining: ${sseClients.length}`);
  });
};
