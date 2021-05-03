//
// Case-insensitive string comparison
//
export function equalsIgnoreCase(x, y) {
  if (x == y) return true;
  if (!x && y) return false;
  return x.localeCompare(y, undefined, { sensitivity: 'base' }) == 0;
}