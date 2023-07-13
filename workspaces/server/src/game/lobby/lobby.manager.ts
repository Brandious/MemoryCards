import { SocketExceptions } from '@shared/server/SocketExceptions';
import { ServerException } from '@app/game/server.exception';
import { Server } from 'socket.io';

import { Cron } from '@nestjs/schedule';
import { Lobby } from './lobby';
import { AuthenticatedSocket } from '../game/types';
import { LobbyMode } from './types';
import { LOBBY_MAX_LIFETIME, MAX_CLIENTS } from '../constants';
import { ServerEvents } from '../../../../shared/server/ServerEvents';
import { ServerPayloads } from '../../../../shared/server/ServerPayloads';

export class LobbyManager {
  public server: Server;
  private readonly lobbies: Map<Lobby['id'], Lobby> = new Map<
    Lobby['id'],
    Lobby
  >();

  public initializeSocket(client: AuthenticatedSocket): void {
    client.data.lobby = null;
  }

  public terminateSocket(client: AuthenticatedSocket): void {
    client.data.lobby?.removeClient(client);
  }

  public createLobby(mode: LobbyMode, delayBetweenRounds: number): Lobby {
    let maxClients = MAX_CLIENTS;

    switch (mode) {
      case 'solo':
        maxClients = 1;
        break;
      case 'duo':
        maxClients = 2;
        break;
    }

    const lobby = new Lobby(this.server, maxClients);

    lobby.instance.delayBetweenRounds = delayBetweenRounds;
    this.lobbies.set(lobby.id, lobby);
    return lobby;
  }

  public joinLobby(lobbyId: string, client: AuthenticatedSocket): void {
    const lobby = this.lobbies.get(lobbyId);

    if (!lobby) {
      throw new ServerException(SocketExceptions.LobbyError, 'Lobby not found');
    }

    if (lobby.clients.size >= lobby.maxClients) {
      throw new ServerException(SocketExceptions.LobbyError, 'Lobby is full');
    }

    lobby.addClient(client);
  }

  @Cron('*/5 * * * * *')
  private lobbiesCleaner() {
    for (const [lobbyId, lobby] of this.lobbies) {
      const now = new Date().getTime();
      const lobbyCreatedAt = lobby.createdAt.getTime();
      const lobbyLifetime = now - lobbyCreatedAt;

      if (lobbyLifetime > LOBBY_MAX_LIFETIME) {
        lobby.dispatchToLobby<ServerPayloads[ServerEvents.GameMessage]>(
          ServerEvents.GameMessage,
          {
            color: 'blue',
            message: 'Game time out',
          },
        );

        lobby.instance.triggerFinish();
        this.lobbies.delete(lobbyId);
      }
    }
  }
}
