function posKey(p) {
  return `${p.col},${p.row}`
}

function isAdj(a, b) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1
}

function cellsFromMask(mask) {
  const playable = []
  for (let row = 0; row < mask.length; row++) {
    for (let col = 0; col < mask[row].length; col++) {
      if (mask[row][col] === '#') playable.push({ col, row })
    }
  }
  return playable
}

function isValidPath(path, goal, playableSet) {
  const seen = new Set()
  for (let i = 0; i < path.length; i++) {
    const p = path[i]
    const k = posKey(p)
    if (!playableSet.has(k) || seen.has(k)) return false
    seen.add(k)
    if (i > 0 && !isAdj(path[i - 1], p)) return false
  }
  const last = path[path.length - 1]
  return last.col === goal.col && last.row === goal.row
}

function findHamiltonPath(playable, start, goal) {
  const playableSet = new Set(playable.map(posKey))
  if (!playableSet.has(posKey(start)) || !playableSet.has(posKey(goal))) return null
  const total = playable.length
  const visited = new Set()
  const path = []

  function dfs(c, r) {
    const keyHere = posKey({ col: c, row: r })
    if (!playableSet.has(keyHere)) return false
    visited.add(keyHere)
    path.push({ col: c, row: r })
    if (path.length === total) {
      const ok = c === goal.col && r === goal.row
      if (!ok) {
        visited.delete(keyHere)
        path.pop()
      }
      return ok
    }
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nc = c + dc
      const nr = r + dr
      const key = posKey({ col: nc, row: nr })
      if (playableSet.has(key) && !visited.has(key) && dfs(nc, nr)) return true
    }
    visited.delete(keyHere)
    path.pop()
    return false
  }

  if (!dfs(start.col, start.row)) return null
  return isValidPath(path, goal, playableSet) ? path : null
}

const drafts = [
  {
    id: 1,
    mask: ['###', '###', '###'],
    start: { col: 0, row: 0 },
    goal: { col: 2, row: 2 },
  },
  {
    id: 2,
    mask: ['###.', '###.', '###.'],
    start: { col: 0, row: 0 },
    goal: { col: 3, row: 2 },
  },
  {
    id: 3,
    mask: ['####', '#..#', '#..#', '####'],
    start: { col: 0, row: 0 },
    goal: { col: 0, row: 3 },
  },
  {
    id: 4,
    mask: ['####', '####', '.###', '.###', '####'],
    start: { col: 0, row: 0 },
    goal: { col: 3, row: 4 },
  },
  {
    id: 5,
    mask: ['.###.', '#####', '..#..', '#####'],
    start: { col: 0, row: 0 },
    goal: { col: 4, row: 3 },
  },
  {
    id: 6,
    mask: ['#####', '#...#', '#####', '#...#', '#####'],
    start: { col: 0, row: 0 },
    goal: { col: 4, row: 4 },
  },
  {
    id: 7,
    mask: ['#####', '#.#.#', '#####', '#.#.#', '#####'],
    start: { col: 4, row: 0 },
    goal: { col: 0, row: 4 },
  },
  {
    id: 8,
    mask: ['######', '###...', '...###', '...###', '######'],
    start: { col: 0, row: 0 },
    goal: { col: 5, row: 4 },
  },
  {
    id: 9,
    mask: ['######', '#....#', '######', '#....#', '######'],
    start: { col: 5, row: 0 },
    goal: { col: 0, row: 4 },
  },
  {
    id: 10,
    mask: ['######', '#....#', '#.##.#', '#.##.#', '#....#', '######'],
    start: { col: 0, row: 0 },
    goal: { col: 5, row: 5 },
  },
]

for (const d of drafts) {
  const playable = cellsFromMask(d.mask)
  const path = findHamiltonPath(playable, d.start, d.goal)
  console.log(
    `Lv${d.id}: ${path ? 'OK' : 'FAIL'} cells=${playable.length}`,
    d.mask.join(' | ')
  )
}
