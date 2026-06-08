function posKey(p) {
  return `${p.col},${p.row}`;
}

function hasHamiltonPath(cols, rows, start, goal, blocked = []) {
  const blockedSet = new Set(blocked.map(posKey));
  const total = cols * rows - blockedSet.size;
  const visited = new Set();
  const path = [];

  function dfs(c, r) {
    const keyHere = posKey({ col: c, row: r });
    if (blockedSet.has(keyHere)) return false;
    visited.add(keyHere);
    path.push({ col: c, row: r });

    if (path.length === total) {
      return c === goal.col && r === goal.row;
    }

    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nc = c + dc;
      const nr = r + dr;
      const key = posKey({ col: nc, row: nr });
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

  return dfs(start.col, start.row);
}

const levels = [
  { id: 1, cols: 3, rows: 3, start: { col: 0, row: 0 }, goal: { col: 2, row: 2 }, want: 0 },
  { id: 2, cols: 4, rows: 3, start: { col: 0, row: 0 }, goal: { col: 3, row: 2 }, want: 1 },
  { id: 3, cols: 4, rows: 4, start: { col: 0, row: 0 }, goal: { col: 0, row: 3 }, want: 1 },
  { id: 4, cols: 4, rows: 5, start: { col: 0, row: 0 }, goal: { col: 3, row: 4 }, want: 1 },
  { id: 5, cols: 5, rows: 4, start: { col: 0, row: 0 }, goal: { col: 4, row: 3 }, want: 2 },
  { id: 6, cols: 5, rows: 5, start: { col: 0, row: 0 }, goal: { col: 4, row: 4 }, want: 2 },
  { id: 7, cols: 5, rows: 5, start: { col: 4, row: 0 }, goal: { col: 0, row: 4 }, want: 2 },
  { id: 8, cols: 6, rows: 5, start: { col: 0, row: 0 }, goal: { col: 5, row: 4 }, want: 2 },
  { id: 9, cols: 6, rows: 5, start: { col: 5, row: 0 }, goal: { col: 0, row: 4 }, want: 2 },
  { id: 10, cols: 6, rows: 6, start: { col: 0, row: 0 }, goal: { col: 5, row: 5 }, want: 3 },
];

function allCells(cols, rows, start, goal) {
  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if ((col === start.col && row === start.row) || (col === goal.col && row === goal.row)) continue;
      cells.push({ col, row });
    }
  }
  return cells;
}

function combos(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combos(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = combos(rest, k);
  return [...withFirst, ...withoutFirst];
}

for (const lv of levels) {
  const cells = allCells(lv.cols, lv.rows, lv.start, lv.goal);
  if (lv.want === 0) {
    console.log(`Level ${lv.id}: []`);
    continue;
  }

  let found = null;
  for (let k = lv.want; k >= 1 && !found; k--) {
    for (const combo of combos(cells, k)) {
      if (hasHamiltonPath(lv.cols, lv.rows, lv.start, lv.goal, combo)) {
        found = combo;
        break;
      }
    }
  }

  if (!found) {
    console.log(`Level ${lv.id}: NO SOLUTION`);
  } else {
    console.log(`Level ${lv.id}: ${JSON.stringify(found)}`);
  }
}
