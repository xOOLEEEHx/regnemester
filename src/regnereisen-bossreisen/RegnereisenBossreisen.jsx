import { useEffect, useRef } from "react";
import styles from "./styles.css?inline";
import templateHtml from "./template.html?raw";
import { createGame } from "./phaser/game";
import { ProgressStore } from "./game/simulation/progress";
import { HudController, setHudElementRoot } from "./ui/hud";
import { observeDeferredImages } from "./ui/deferredImages";
import { resolveAvailableMapId } from "./game/content/mapAvailability";

const regnereisenMarkup = templateHtml.match(/<main id="app">[\s\S]*<\/main>/)?.[0] || "";

export default function RegnereisenBossreisen({ onBack, tallvokterEnabled = false }) {
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
    const stopDeferredImageObserver = observeDeferredImages(shadow);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const progress = new ProgressStore();
    const selectedMapId = progress.getSettings().mapId;
    const availableMapId = resolveAvailableMapId(selectedMapId, tallvokterEnabled);
    if (availableMapId !== selectedMapId) {
      progress.updateSettings({ mapId: availableMapId });
    }
    setHudElementRoot(shadow);
    const hud = new HudController(progress, tallvokterEnabled);
    const gameRoot = shadow.getElementById("game");
    const game = createGame(progress, hud, gameRoot || "game");
    hud.openEntryScreen();

    const handleBack = (event) => {
      event.preventDefault();
      onBackRef.current?.();
    };

    window.addEventListener("regnereisen:back", handleBack);

    return () => {
      stopDeferredImageObserver();
      window.removeEventListener("regnereisen:back", handleBack);
      hud.destroy();
      game.destroy(true);
      setHudElementRoot(document);
      shadow.innerHTML = "";
    };
  }, [tallvokterEnabled]);

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
