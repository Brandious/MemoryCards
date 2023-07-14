import { Cards } from '@shared/common/Cards';
import { ServerException } from '@app/game/server.exception';
// import { ServerEvents, ServerPayloads } from './../game/game.gateway';
import { Socket } from 'socket.io';
import { CardState } from './card-state';
import { Lobby } from '../lobby/lobby';
import { AuthenticatedSocket } from '../game/types';
import { SECOND } from '../constants';
import { ServerPayloads } from '../../../../shared/server/ServerPayloads';
import { ServerEvents } from '../../../../shared/server/ServerEvents';
import { SocketExceptions } from '../../../../shared/server/SocketExceptions';

export class Instance {
  public hasStarted = false;

  public hasFinished = false;

  public isSuspended = false;

  public currentRound = 1;

  public cards: CardState[] = [];

  public scores: Record<Socket['id'], number> = {};

  public delayBetweenRounds = 2;

  private cardsRevealedForCurrentRound: Record<number, Socket['id']> = {};

  constructor(private readonly lobby: Lobby) {
    this.initializeCards();
  }

  public triggerStart(): void {
    if (this.hasStarted) {
      return;
    }

    this.hasStarted = true;

    this.lobby.dispatchToLobby<ServerPayloads[ServerEvents.GameMessage]>(
      ServerEvents.GameMessage,
      {
        color: 'blue',
        message: 'Game started',
      },
    );
  }

  public triggerFinish(): void {
    if (this.hasFinished || !this.hasStarted) return;

    this.hasFinished = true;
    this.lobby.dispatchToLobby<ServerPayloads[ServerEvents.GameMessage]>(
      ServerEvents.GameMessage,
      {
        color: 'blue',
        message: 'Game finished',
      },
    );
  }

  public revealCard(cardIndex: number, client: AuthenticatedSocket): void {
    if (this.isSuspended || this.hasFinished || !this.hasStarted) return;

    console.log(cardIndex, client);
    let cardAlreadyRevealedCount = 0;

    for (const clientId of Object.values(this.cardsRevealedForCurrentRound)) {
      if (clientId === client.id) {
        cardAlreadyRevealedCount++;
      }
    }

    console.log('CARDALREADY', cardAlreadyRevealedCount);
    if (cardAlreadyRevealedCount >= 2) return;

    const cardState = this.cards[cardIndex];
    console.log(cardState);
    if (!cardState)
      throw new ServerException(
        SocketExceptions.GameError,
        'Card index is invalid',
      );

    if (cardState.isRevealed) return;

    cardState.isRevealed = true;
    cardState.ownerId = client.id;

    this.cardsRevealedForCurrentRound[cardIndex] = cardState.ownerId;

    client.emit<ServerPayloads[ServerEvents.GameMessage]>(
      ServerEvents.GameMessage,
      {
        color: 'blue',
        message: 'Card revealed',
      },
    );

    const everyonePlayed =
      Object.values(this.cardsRevealedForCurrentRound).length ===
      this.lobby.clients.size * 2;

    let everyCardRevealed = true;

    for (const card of this.cards) {
      if (!card.isRevealed) {
        everyCardRevealed = false;
        break;
      }
    }

    if (everyonePlayed || everyCardRevealed) this.transitionToNextRound();

    this.lobby.dispatchLobbyState();
  }

  private transitionToNextRound(): void {
    this.isSuspended = true;

    setTimeout(() => {
      this.isSuspended = false;
      this.currentRound++;
      this.cardsRevealedForCurrentRound = {};

      const cardsRevealed = new Map<Cards, CardState>();

      for (const cardState of this.cards) {
        if (cardState.isLocked) continue;

        if (!cardState.isRevealed) {
          cardState.isRevealed = true;
          continue;
        }

        const previousCard = cardsRevealed.get(cardState.card);

        console.log(
          'piar->',
          cardsRevealed,
          previousCard && previousCard.ownerId === cardState.ownerId,
        );
        if (previousCard && previousCard.ownerId === cardState.ownerId) {
          previousCard.isLocked = true;
          cardState.isLocked = true;
          console.log('HERE ->', cardState);
          // ignore forbiden non-null assertion
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.scores[cardState.ownerId!] =
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (this.scores[cardState.ownerId!] || 0) + 1;
        }

        console.log('cardState.card', cardState.card);
        cardsRevealed.set(cardState.card, cardState);
      }
      console.log(cardsRevealed);
      let everyCardLocked = true;

      for (const cardState of this.cards) {
        if (!cardState.isLocked) {
          cardState.isRevealed = false;
          cardState.ownerId = null;
          everyCardLocked = false;
        }
      }

      if (everyCardLocked) this.triggerFinish();

      this.lobby.dispatchLobbyState();
    }, SECOND * this.delayBetweenRounds);
  }

  private initializeCards(): void {
    const cards = Object.values(Cards).filter((c) =>
      Number.isInteger(c),
    ) as Cards[];

    for (const card of cards) {
      const cardState1 = new CardState(card);
      const cardState2 = new CardState(card);

      this.cards.push(cardState1);
      this.cards.push(cardState2);
    }
    console.log(this.cards);
    this.cards = this.cards.sort((a, b) => 0.5 - Math.random());
  }
}
