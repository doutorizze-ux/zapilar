import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: [
      'https://staysoft.fun',
      'https://api.staysoft.fun',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },
  transports: ['websocket', 'polling'], // Suporte total a WebSockets e Polling fallback
  allowEIO3: true, // Compatibilidade com versões mais antigas se necessário
})
@Injectable()
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  // Map to store connected clients (dashboard users) to their storeId/userId
  private dashboardClients = new Map<string, string>();

  // Use this to send message to frontend
  emitMessageToRoom(room: string, message: any) {
    this.server.to(room).emit('new_message', message);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { userId: string }, // Store Owner ID
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.userId);
    this.dashboardClients.set(client.id, data.userId);
    console.log(`Client ${client.id} joined room ${data.userId}`);
    return { event: 'joined', room: data.userId };
  }
}
