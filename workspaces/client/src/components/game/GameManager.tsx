import useSocketManager from "@/hooks/useSocketManager";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { useRecoilState } from "recoil";
import { ServerPayloads } from "../../../../shared/server/ServerPayloads";
import { Listener } from "../websocket/types";
import { ServerEvents } from "../../../../shared/server/ServerEvents";
import Introduction from "./Introduction";
import Game from "./Game";
import { CurrentLobbyState } from "./states";

function GameManager() {
  const router = useRouter();
  //   const searchParams = useSearchParams();
  const { sm } = useSocketManager();
  const [lobbyState, setLobbyState] = useRecoilState(CurrentLobbyState);
  console.log(lobbyState, CurrentLobbyState);

  useEffect(() => {
    sm.connect();

    const onLobbyState: Listener<
      ServerPayloads[ServerEvents.LobbyState]
    > = async (data) => {
      setLobbyState(data);

      //   useSearchParams().lobby = data.lobbyId;
      console.log(data.lobbyId);
      router.push(`/?${data.lobbyId}`);
    };

    const onGameMessage: Listener<ServerPayloads[ServerEvents.GameMessage]> = ({
      color,
      message,
    }) => {
      console.log(message);
    };

    sm.registerListener(ServerEvents.LobbyState, onLobbyState);
    sm.registerListener(ServerEvents.GameMessage, onGameMessage);

    return () => {
      sm.removeListener(ServerEvents.LobbyState, onLobbyState);
      sm.removeListener(ServerEvents.GameMessage, onGameMessage);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (lobbyState === null) return <Introduction />;
  return <Game />;
}

export default GameManager;
