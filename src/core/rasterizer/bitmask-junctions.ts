export const NORTH = 1;
export const EAST = 2;
export const SOUTH = 4;
export const WEST = 8;

export const JUNCTION_TABLE: readonly string[] = [
  ' ', // 0: None
  '╵', // 1: N
  '╶', // 2: E
  '└', // 3: N + E
  '╷', // 4: S
  '│', // 5: N + S
  '┌', // 6: E + S
  '├', // 7: N + E + S
  '╴', // 8: W
  '┘', // 9: N + W
  '─', // 10: E + W
  '┴', // 11: N + E + W
  '┐', // 12: S + W
  '┤', // 13: N + S + W
  '┬', // 14: E + S + W
  '┼', // 15: N + E + S + W
] as const;

export function resolveJunction(
  currentMask: number,
  addMask: number
): { char: string; mask: number } {
  const mask = (currentMask | addMask) & 0x0f;
  const char = JUNCTION_TABLE[mask] ?? ' ';
  return { char, mask };
}
