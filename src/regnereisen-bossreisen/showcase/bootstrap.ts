import './showcase.css';
import { SHOWCASE_ASSETS } from './assets';
import { createShowcaseGame } from './createShowcaseGame';
import { ShowcasePanel } from './ShowcasePanel';
import { showcaseStore } from './showcaseStore';

export function bootShowcase(): void {
  document.body.classList.add('showcase-mode');
  document.title = 'Tallvokterens verden · Phaser 4.2 visual laboratory';
  showcaseStore.setEffect('ocean', SHOWCASE_ASSETS.waterMask.available);
  const panel = new ShowcasePanel(showcaseStore);
  const game = createShowcaseGame();
  game.events.once('destroy', () => panel.destroy());
}
