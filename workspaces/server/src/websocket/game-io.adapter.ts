import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions, Socket } from 'socket.io';
import { CONNECTION_EVENT } from '@nestjs/websockets/constants';

export class GameIoAdapter extends IoAdapter {
  private options = {
    cors: {
      origin: process.env.CORS_ALLOW_ORIGIN,
    },
    path: '/wsapi',
    transports: ['websocket'],
    serveClient: false,
    maxSocketListeners: 35,
  };

  createIOServer(port: number, options?: ServerOptions): any {
    return super.createIOServer(port, { ...this.options, ...options });
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  public bindClientConnect(server: any, callback: Function): void {
    server.on(CONNECTION_EVENT, (socket: Socket) => {
      socket.setMaxListeners(this.options.maxSocketListeners);
      callback(socket);
    });
  }
}
