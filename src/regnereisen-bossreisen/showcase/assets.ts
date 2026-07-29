export const SHOWCASE_ASSETS = {
  map: {
    key: 'tallvokter-map',
    path: '/regnemester/maps/tallvokterens-rike-v4.png'
  },
  waterMask: {
    sourceKey: 'tallvokter-water-manual-source',
    sourcePath: '/regnemester/maps/tallvokter-fx/manual/tallvokter-water-mask-manual-template.png',
    runtimeKey: 'tallvokter-water-manual-mask-runtime',
    available: true,
    marker: {
      minRed: 235,
      maxGreen: 40,
      minBlue: 235
    }
  },
  waterfallMask: {
    sourceKey: 'tallvokter-waterfalls-manual-source',
    sourcePath: '/regnemester/maps/tallvokter-fx/manual/tallvokter-waterfalls-manual-template.png',
    available: true,
    marker: {
      minRed: 235,
      maxGreen: 40,
      minBlue: 235
    }
  }
} as const;
