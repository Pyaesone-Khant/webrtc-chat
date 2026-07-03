import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080, host: '0.0.0.0' });
const rooms = new Map();

wss.on('connection', (ws) => {
  let currentRoom = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { type, room, payload } = data;

      if (type === 'join') {
        currentRoom = room;
        if (!rooms.has(room)) {
          rooms.set(room, new Set());
        }
        rooms.get(room).add(ws);

        // Notify others in the room
        rooms.get(room).forEach(client => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({ type: 'peer-joined' }));
          }
        });

        // Tell the joining user if there are already peers
        if (rooms.get(room).size > 1) {
          ws.send(JSON.stringify({ type: 'ready' }));
        }

      } else if (type === 'signal') {
        // Broadcast signal (offer, answer, ice-candidate) to other peer in the room
        if (currentRoom && rooms.has(currentRoom)) {
          rooms.get(currentRoom).forEach(client => {
            if (client !== ws && client.readyState === 1) {
              client.send(JSON.stringify({ type: 'signal', payload }));
            }
          });
        }
      }
    } catch (e) {
      console.error('Invalid message', e);
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(ws);
      if (rooms.get(currentRoom).size === 0) {
        rooms.delete(currentRoom);
      } else {
        rooms.get(currentRoom).forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'peer-left' }));
          }
        });
      }
    }
  });
});

console.log(`WebSocket signaling server running on localhost`);
