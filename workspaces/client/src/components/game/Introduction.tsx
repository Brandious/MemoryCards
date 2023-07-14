import useSocketManager from "@/hooks/useSocketManager";
// import { emitEvent } from "@/utils/analytics";
import { Divider, Select } from "@mantine/core";
import { ClientEvents } from "@memory-cards/shared/client/ClientEvents";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";

function Introduction() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sm } = useSocketManager();

  const [delayBetweenRounds, setDelayBetweenRounds] = React.useState(2);

  console.log(searchParams);

  useEffect(() => {
    if (searchParams.has("lobby"))
      sm.emit({
        event: ClientEvents.LobbyJoin,
        data: {
          lobbyId: searchParams.get("lobby")!,
        },
      });
    //  no exhaustive deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const onCreateLobby = (mode: "solo" | "duo") => {
    sm.emit({
      event: ClientEvents.LobbyCreate,
      data: {
        mode: mode,
        delayBetweenRounds: delayBetweenRounds,
      },
    });

    // emitEvent("lobby_create");
  };
  return (
    <div className="mt-4">
      <h2 className="text-2xl">Hello ! 👋</h2>

      <p className="mt-3 text-lg">
        Welcome to a simple game to test your memory against other players or
        yourself (solo mode).
        <br />
        Reveal cards by clicking on them, you can reveal two card per round,
        your opponent too.
        <br />
        Once you revealed cards, if they match then you gain a point.
        You&apos;ll also see the cards revealed by your opponent.
        <br />
        Game is over once all cards are revealed. Player with most points wins!
      </p>

      <Divider my="md" />

      <div>
        <h3 className="text-xl">Game options</h3>

        <Select
          label="Delay between rounds"
          defaultValue="2"
          onChange={(delay) => setDelayBetweenRounds(+delay!)}
          data={[
            { value: "1", label: "1 second" },
            { value: "2", label: "2 seconds" },
            { value: "3", label: "3 seconds" },
            { value: "4", label: "4 seconds" },
            { value: "5", label: "5 seconds" },
          ]}
        />
      </div>

      <div className="mt-5 text-center flex justify-between">
        <button className="btn" onClick={() => onCreateLobby("solo")}>
          Create solo lobby
        </button>
        <button className="btn" onClick={() => onCreateLobby("duo")}>
          Create duo lobby
        </button>
      </div>
    </div>
  );
}

export default Introduction;
