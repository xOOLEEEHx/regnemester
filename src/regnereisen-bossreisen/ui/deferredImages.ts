export function hydrateDeferredImages(root: ParentNode): void {
  const images = root.querySelectorAll<HTMLImageElement>('img[data-src]');
  images.forEach((image) => {
    if (image.closest('.is-hidden')) {
      return;
    }
    const source = image.dataset.src?.trim();
    if (!source) {
      return;
    }
    if (!image.hasAttribute('src')) {
      image.src = source;
    }
    image.removeAttribute('data-src');
  });
}

export function observeDeferredImages(root: ShadowRoot): () => void {
  hydrateDeferredImages(root);
  const observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.type === 'attributes' || mutation.addedNodes.length > 0)) {
      hydrateDeferredImages(root);
    }
  });
  observer.observe(root, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    subtree: true
  });
  return () => observer.disconnect();
}
