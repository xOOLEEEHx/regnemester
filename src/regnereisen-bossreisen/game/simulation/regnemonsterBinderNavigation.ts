export function getRegnemonsterBinderTargetPage(
  currentPage: number,
  direction: -1 | 1,
  pageCount: number,
  landscapeSpread: boolean
): number {
  if (pageCount <= 0) {
    return 0;
  }

  const pageStep = landscapeSpread ? 2 : 1;
  const finalPage = landscapeSpread
    ? Math.max(0, pageCount - (pageCount % 2 === 0 ? 2 : 1))
    : pageCount - 1;
  return Math.min(finalPage, Math.max(0, currentPage + direction * pageStep));
}
