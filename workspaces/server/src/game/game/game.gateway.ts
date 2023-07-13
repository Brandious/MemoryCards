import { ServerPayloads } from './../../../../shared/server/ServerPayloads';
import { ClientEvents } from './../../../../shared/client/ClientEvents';
import { Logger, UsePipes } from '@nestjs/common';
import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';

import { Socket, Server } from 'socket.io';
import { WsValidationPipe } from '../../websocket/ws.validation-pipe';
import { LobbyManager } from '../lobby/lobby.manager';
import { AuthenticatedSocket } from './types';
import { LobbyCreateDto, LobbyJoinDto, RevealCardDto } from './dto';
import { ServerEvents } from '../../../../shared/server/ServerEvents';
import { ServerException } from '../server.exception';
import { SocketExceptions } from '../../../../shared/server/SocketExceptions';

@UsePipes(new WsValidationPipe())
@WebSocketGateway()
export class GameGateway implements OnGatewayConnection {
  private readonly logger: Logger = new Logger(GameGateway.name);

  constructor(private readonly lobbyManager: LobbyManager) {}

  afterInit(server: Server): void {
    this.lobbyManager.server = server;
    this.logger.log('Game server started');
  }

  async handleConnection(client: Socket, ...args: any[]): Promise<void> {
    this.lobbyManager.initializeSocket(client as AuthenticatedSocket);
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    this.lobbyManager.terminateSocket(client as AuthenticatedSocket);
  }

  @SubscribeMessage(ClientEvents.Ping)
  onPing(client: AuthenticatedSocket): void {
    client.emit(ServerEvents.Pong, {
      message: 'pong',
    });
  }

  @SubscribeMessage(ClientEvents.LobbyCreate)
  onLobbyCreate(
    client: AuthenticatedSocket,
    data: LobbyCreateDto,
  ): WsResponse<ServerPayloads[ServerEvents.GameMessage]> {
    const lobby = this.lobbyManager.createLobby(
      data.mode,
      data.delayBetweenRounds,
    );
    lobby.addClient(client);

    return {
      event: ServerEvents.GameMessage,
      data: {
        color: 'green',
        message: 'Lobby created',
      },
    };
  }

  @SubscribeMessage(ClientEvents.LobbyJoin)
  onLobbyJoin(client: AuthenticatedSocket, data: LobbyJoinDto): void {
    this.lobbyManager.joinLobby(data.lobbyId, client);
  }

  @SubscribeMessage(ClientEvents.LobbyLeave)
  onLobbyLeave(client: AuthenticatedSocket): void {
    client.data.lobby?.removeClient(client);
  }

  @SubscribeMessage(ClientEvents.GameRevealCard)
  onRevealCard(client: AuthenticatedSocket, data: RevealCardDto): void {
    if (!client.data.lobby) {
      throw new ServerException(SocketExceptions.LobbyError, 'Lobby not found');
    }

    client.data.lobby.instance.revealCard(data.cardIndex, client);
  }
}
