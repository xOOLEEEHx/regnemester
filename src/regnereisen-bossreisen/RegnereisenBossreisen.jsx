import { useEffect, useRef } from "react";
import styles from "./styles.css?inline";
import templateHtml from "./template.html?raw";
import { createGame } from "./phaser/game";
import { ProgressStore } from "./game/simulation/progress";
import { HudController, setHudElementRoot } from "./ui/hud";

const regnereisenMarkup = templateHtml.match(/<main id="app">[\s\S]*<\/main>/)?.[0] || "";

export default function RegnereisenBossreisen({ onBack }) {
  const hostRef = useRef(null);
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
    shadow.innerHTML = `<style>${styles}</style>${regnereisenMarkup}`;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const progress = new ProgressStore();
    setHudElementRoot(shadow);
    const hud = new HudController(progress);
    const gameRoot = shadow.getElementById("game");
    const game = createGame(progress, hud, gameRoot || "game");
    hud.openEntryScreen();

    const handleBack = (event) => {
      event.preventDefault();
      onBackRef.current?.();
    };

    window.addEventListener("regnereisen:back", handleBack);

    return () => {
      window.removeEventListener("regnereisen:back", handleBack);
      hud.destroy();
      game.destroy(true);
      setHudElementRoot(document);
      shadow.innerHTML = "";
    };
  }, []);

  return (
    <div
      ref={hostRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "#08283f",
      }}
    />
  );
}
