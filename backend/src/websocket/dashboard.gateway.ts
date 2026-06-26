import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true },
  namespace: '/dashboard',
})
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clients: Map<string, Socket> = new Map();

  handleConnection(client: Socket) {
    this.clients.set(client.id, client);
    client.emit('connected', { message: 'Terhubung ke dashboard real-time' });
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client.id);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { channel: string }) {
    client.join(payload.channel);
    return { event: 'subscribed', data: { channel: payload.channel } };
  }

  emitUpdate(channel: string, data: any) {
    this.server.to(channel).emit('update', data);
  }

  emitSupplyUpdate(data: any) {
    this.server.emit('supply-update', data);
  }

  emitRiskUpdate(data: any) {
    this.server.emit('risk-update', data);
  }

  emitDemandUpdate(data: any) {
    this.server.emit('demand-update', data);
  }

  emitLogisticsUpdate(data: any) {
    this.server.emit('logistics-update', data);
  }

  emitNotification(data: any) {
    this.server.emit('notification', data);
  }
}
