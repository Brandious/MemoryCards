import { CardStateDefinition } from "../common/types";
import { ServerEvents } from "./ServerEvents";

export type ServerPayloads = {
  [ServerEvents.LobbyState]: {
    lobbyId: string;
    mode: "solo" | "duo";
    delayBetweenRounds: number;
    hasStarted: boolean;
    hasFinished: boolean;
    currentRound: number;
    playersCount: number;
    cards: CardStateDefinition[];
    isSuspended: boolean;
    scores: Record<string, number>;
  };

  [ServerEvents.GameMessage]: {
    message: string;
    color?: "green" | "red" | "blue" | "orange";
  };
};
