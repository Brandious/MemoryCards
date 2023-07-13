"use client";

import GameManager from "@/components/game/GameManager";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <GameManager />
    </main>
  );
}
