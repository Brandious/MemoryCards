import useSocketManager from "@/hooks/useSocketManager";
import { useRecoilValue } from "recoil";
import { CurrentLobbyState } from "./states";
import { ClientEvents } from "@memory-cards/shared/client/ClientEvents";
import { Badge, LoadingOverlay, Overlay } from "@mantine/core";
import Card from "./Card";

export default function Game() {
  const { sm } = useSocketManager();

  const currentLobbyState = useRecoilValue(CurrentLobbyState);

  const clientId = sm.getSocketId()!;

  let clientScore = 0;
  let opponentScore = 0;

  for (const scoreId in currentLobbyState?.scores) {
    if (scoreId === clientId) clientScore = currentLobbyState.scores[scoreId];
    else opponentScore = currentLobbyState.scores[scoreId];
  }

  let result: string;
  let resultColor: string;

  if (clientScore === opponentScore) {
    result = "Draw";
    resultColor = "yellow";
  } else if (clientScore > opponentScore) {
    result = "You Win";
    resultColor = "green";
  } else {
    result = "You Lose";
    resultColor = "red";
  }

  const onRevealCard = (cardIndex: number) => {
    console.log("Reveal card", cardIndex);
    sm.emit({
      event: ClientEvents.GameRevealCard,
      data: { cardIndex },
    });

    console.log("Reveal card", cardIndex);
  };

  const onReplay = () => {
    sm.emit({
      event: ClientEvents.LobbyCreate,
      data: {
        mode: currentLobbyState?.mode,
        delayBetweenRounds: currentLobbyState?.delayBetweenRounds,
      },
    });
  };

  const copyLobbyLink = async () => {
    const link = `${window.location.origin}?lobby=${currentLobbyState?.lobbyId}`;
    await navigator.clipboard.writeText(link);

    console.log("Copied to clipboard");
  };

  console.log("LOBBY", currentLobbyState);
  return (
    <div>
      <div className="flex justify-between items-center my-5">
        <Badge size="xl">Your score: {clientScore}</Badge>
        <Badge variant="outline">
          {!currentLobbyState?.hasStarted ? (
            <span>Waiting for opponent...</span>
          ) : (
            <span>Round {currentLobbyState.currentRound}</span>
          )}
        </Badge>

        {currentLobbyState?.mode === "duo" && (
          <Badge size="xl" color="red">
            Opponent score: {opponentScore}
          </Badge>
        )}
      </div>

      {currentLobbyState?.isSuspended && (
        <div className="text-center text-lg">
          Next round starting soon, remember cards !
        </div>
      )}

      <div className="grid grid-cols-7 gap-4 relative select-none">
        {currentLobbyState?.hasFinished && (
          <Overlay opacity={0.6} color="#000" blur={2} zIndex={5} />
        )}
        <LoadingOverlay
          visible={
            !currentLobbyState?.hasStarted || currentLobbyState.isSuspended
          }
        />

        {currentLobbyState?.cards.map((card, i) => (
          <div key={i} className="col-span-1">
            <Card
              card={card}
              cardIndex={i}
              onRevealCard={onRevealCard}
              clientId={clientId}
            />
          </div>
        ))}
      </div>

      {currentLobbyState?.hasFinished && (
        <div className="text-center mt-5 flex flex-col">
          <Badge size="xl" color={resultColor} className="self-center">
            {result}
          </Badge>
          <button className="mt-3 self-center" onClick={onReplay}>
            Play again ?
          </button>
        </div>
      )}

      {!currentLobbyState?.hasStarted && (
        <div className="text-center mt-5">
          <button className="btn" onClick={copyLobbyLink}>
            Copy lobby link
          </button>
        </div>
      )}
    </div>
  );
}
