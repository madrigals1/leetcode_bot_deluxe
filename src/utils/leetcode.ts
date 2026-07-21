export function getDifficultyCount(
  arr: Array<{ difficulty: string; count: number }>,
  difficulty: string,
) {
  return arr.find((x) => x.difficulty === difficulty)?.count ?? 0;
}
