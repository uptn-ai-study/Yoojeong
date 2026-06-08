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

function findPath(playable, start, goal) {
  const set = new Set(playable.map(posKey))
  if (!set.has(posKey(start)) || !set.has(posKey(goal))) return null
  const total = playable.length
  const visited = new Set()
  const path = []
  function dfs(c, r) {
    const k = posKey({ col: c, row: r })
    if (!set.has(k)) return false
    visited.add(k)
    path.push({ col: c, row: r })
    if (path.length === total) {
      const ok = c === goal.col && r === goal.row
      if (!ok) {
        visited.delete(k)
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
      const nk = posKey({ col: nc, row: nr })
      if (set.has(nk) && !visited.has(nk) && dfs(nc, nr)) return true
    }
    visited.delete(k)
    path.pop()
    return false
  }
  if (!dfs(start.col, start.row)) return null
  for (let i = 1; i < path.length; i++) {
    if (!isAdj(path[i - 1], path[i])) return null
  }
  return path
}

const drafts = [
  {
    id: 1,
    name: 'square',
    mask: ['###', '###', '###'],
    start: { col: 0, row: 0 },
    goal: { col: 2, row: 2 },
  },
  {
    id: 2,
    name: 'corner-cut',
    mask: ['##..', '####', '####'],
    start: { col: 0, row: 0 },
    goal: { col: 3, row: 2 },
  },
  {
    id: 3,
    name: 'left-notch',
    mask: ['####', '.###', '.###', '####'],
    start: { col: 0, row: 0 },
    goal: { col: 0, row: 3 },
  },
  {
    id: 4,
    name: 'stair',
    mask: ['####', '.###', '..##', '...#'],
    start: { col: 0, row: 0 },
    goal: { col: 3, row: 3 },
  },
  {
    id: 4,
    name: 'right-bar',
    mask: ['.###', '.###', '.###', '.###', '####'],
    start: { col: 1, row: 0 },
    goal: { col: 0, row: 4 },
  },
  {
    id: 5,
    name: 't-shape',
    mask: ['.###.', '#####', '..#..', '#####'],
    start: { col: 0, row: 0 },
    goal: { col: 4, row: 3 },
  },
  {
    id: 5,
    name: 'cross',
    mask: ['..#..', '.###.', '#####', '.###.', '..#..'],
    start: { col: 0, row: 0 },
    goal: { col: 4, row: 4 },
  },
  {
    id: 6,
    name: 'h-shape',
    mask: ['#####', '#...#', '#####', '#...#', '#####'],
    start: { col: 0, row: 0 },
    goal: { col: 4, row: 4 },
  },
  {
    id: 6,
    name: 'donut',
    mask: ['#####', '#...#', '#...#', '#...#', '#####'],
    start: { col: 0, row: 0 },
    goal: { col: 4, row: 4 },
  },
  {
    id: 7,
    name: 'zig',
    mask: ['######', '###...', '...###', '######'],
    start: { col: 0, row: 0 },
    goal: { col: 5, row: 3 },
  },
  {
    id: 8,
    name: 'u-shape',
    mask: ['######', '#....#', '#....#', '######'],
    start: { col: 0, row: 0 },
    goal: { col: 5, row: 3 },
  },
  {
    id: 9,
    name: 'two-room',
    mask: ['######', '##..##', '##..##', '######'],
    start: { col: 5, row: 0 },
    goal: { col: 0, row: 3 },
  },
  {
    id: 10,
    name: 'frame',
    mask: ['######', '#....#', '#.##.#', '#.##.#', '#....#', '######'],
    start: { col: 0, row: 0 },
    goal: { col: 5, row: 5 },
  },
  {
    id: 10,
    name: 'l-maze',
    mask: ['######', '#.....', '#.####', '#.#...', '#.####', '######'],
    start: { col: 0, row: 0 },
    goal: { col: 5, row: 5 },
  },
]

for (const d of drafts) {
  const playable = cellsFromMask(d.mask)
  const path = findPath(playable, d.start, d.goal)
  console.log(
    `Lv${d.id} ${d.name}: ${path ? 'OK' : 'FAIL'} (${playable.length})`,
    d.mask.join(' | ')
  )
}
