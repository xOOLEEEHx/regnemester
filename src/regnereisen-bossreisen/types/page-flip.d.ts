declare module 'page-flip' {
  export type PageFlipOrientation = 'portrait' | 'landscape';
  export type PageFlipEvent = {
    data: number | string | boolean | object;
    object: PageFlip;
  };

  export class PageFlip {
    constructor(
      element: HTMLElement,
      settings: {
        width: number;
        height: number;
        size?: 'fixed' | 'stretch';
        minWidth?: number;
        maxWidth?: number;
        minHeight?: number;
        maxHeight?: number;
        drawShadow?: boolean;
        flippingTime?: number;
        usePortrait?: boolean;
        startZIndex?: number;
        autoSize?: boolean;
        maxShadowOpacity?: number;
        showCover?: boolean;
        mobileScrollSupport?: boolean;
        clickEventForward?: boolean;
        useMouseEvents?: boolean;
        swipeDistance?: number;
        showPageCorners?: boolean;
        disableFlipByClick?: boolean;
      }
    );

    loadFromHTML(elements: HTMLElement[]): void;
    updateFromHtml(elements: HTMLElement[]): void;
    turnToPage(page: number): void;
    flipNext(corner?: 'top' | 'bottom'): void;
    flipPrev(corner?: 'top' | 'bottom'): void;
    getPageCount(): number;
    getCurrentPageIndex(): number;
    getOrientation(): PageFlipOrientation;
    update(): void;
    on(eventName: string, callback: (event: PageFlipEvent) => void): PageFlip;
  }
}
