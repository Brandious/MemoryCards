import { Socket, Server } from 'socket.io';
import { v4 } from 'uuid';
import { AuthenticatedSocket } from '../game/types';
import { Instance } from '../instance/instance';
import { ServerPayloads } from '@shared/server/ServerPayloads';
import { ServerEvents } from '@shared/server/ServerEvents';
// import { ServerEvents, ServerPayloads } from '././game/game.gateway';

export class Lobby {
  public readonly id: string = v4();
  public readonly createdAt: Date = new Date();

  public clients: Map<Socket['id'], AuthenticatedSocket> = new Map<
    Socket['id'],
    AuthenticatedSocket
  >();

  public readonly instance: Instance = new Instance(this);

  constructor(
    private readonly server: Server,
    public readonly maxClients: number,
  ) {}

  public addClient(client: AuthenticatedSocket): void {
    this.clients.set(client.id, client);
    client.join(this.id);
    client.data.lobby = this;

    if (this.clients.size >= this.maxClients) {
      this.instance.triggerStart();
    }

    this.dispatchLobbyState();
  }

  public removeClient(client: AuthenticatedSocket): void {
    this.clients.delete(client.id);
    client.leave(this.id);
    client.data.lobby = null;

    this.instance.triggerFinish();

    this.dispatchToLobby<ServerPayloads[ServerEvents.GameMessage]>(
      ServerEvents.GameMessage,
      {
        color: 'blue',
        message: 'Opponent left lobby',
      },
    );

    this.dispatchLobbyState();
  }

  public dispatchLobbyState(): void {
    const payload: ServerPayloads[ServerEvents.LobbyState] = {
      lobbyId: this.id,
      mode: this.maxClients === 1 ? 'solo' : 'duo',
      delayBetweenRounds: this.instance.delayBetweenRounds,
      hasStarted: this.instance.hasStarted,
      hasFinished: this.instance.hasFinished,
      currentRound: this.instance.currentRound,
      playersCount: this.clients.size,
      cards: this.instance.cards.map((el) => el.toDefinition()),
      isSuspended: this.instance.isSuspended,
      scores: this.instance.scores,
    };

    this.dispatchToLobby(ServerEvents.LobbyState, payload);
  }

  public dispatchToLobby<T>(event: ServerEvents, payload: T): void {
    this.server.to(this.id).emit(event, payload);
  }
}
