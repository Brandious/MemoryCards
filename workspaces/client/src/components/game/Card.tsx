import { CardStateDefinition } from "@memory-cards/shared/common/types";
import Image from "next/image";
import { CardsMap } from "../../icons/Cards/CardsMap";

type CardProps = {
  card: CardStateDefinition;
  cardIndex: number;
  onRevealCard: (cardIndex: number) => void;
  clientId: string;
};

export default function Card({
  card,
  cardIndex,
  onRevealCard,
  clientId,
}: CardProps) {
  let cardBg = "bg-white/10";

  if (card.owner)
    cardBg = card.owner === clientId ? "bg-green-500" : "bg-red-500";

  return (
    <div className={`transition py-3 flex ${cardBg}`}>
      <Image
        src={CardsMap(card.card)}
        className={`
              transition
              hover:scale-[0.85]
              ${card.card === null ? "cursor-pointer" : ""}
              ${
                cardIndex % 2 === 0
                  ? "hover:rotate-[-8deg]"
                  : "hover:rotate-[8deg]"
              }
            `}
        alt={"Card"}
        onClick={() => card.card === null && onRevealCard(cardIndex)}
      />
    </div>
  );
}
