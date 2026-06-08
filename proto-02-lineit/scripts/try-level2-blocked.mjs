// Quick helper to find which single blocked cells keep a Hamilton path

function posKey(c, r) {
  return `${c},${r}`;
}

function hasHamiltonPath(cols, rows, start, goal, blocked) {
  const blockedSet = new Set(blocked.map((b) => posKey(b.col, b.row)));
  const total = cols * rows - blockedSet.size;
  const visited = new Set();
  const path = [];

  function dfs(c, r) {
    const keyHere = posKey(c, r);
    if (blockedSet.has(keyHere)) return false;
    visited.add(keyHere);
    path.push({ col: c, row: r });

    if (path.length === total) {
      return c === goal.col && r === goal.row;
    }

    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dc, dr] of dirs) {
      const nc = c + dc;
      const nr = r + dr;
      const key = posKey(nc, nr);
      if (
        nc >= 0 &&
        nc < cols &&
        nr >= 0 &&
        nr < rows &&
        !blockedSet.has(key) &&
        !visited.has(key) &&
        dfs(nc, nr)
      ) {
        return true;
      }
    }

    visited.delete(keyHere);
    path.pop();
    return false;
  }

  if (!dfs(start.col, start.row)) return false;
  return true;
}

const cols = 4;
const rows = 3;
const start = { col: 0, row: 0 };
const goal = { col: 3, row: 2 };

for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    if ((c === start.col && r === start.row) || (c === goal.col && r === goal.row)) {
      continue;
    }
    const ok = hasHamiltonPath(cols, rows, start, goal, [{ col: c, row: r }]);
    console.log(`blocked=(${c},${r}) -> ${ok ? 'OK' : 'NO'}`);
  }
}

