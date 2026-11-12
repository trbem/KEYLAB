/** Visual reference layout; widths are approximations, not manufacturing dimensions. */
export type Ace68Key = { id: string; label: string; x: number; row: number; width: number };
type Entry = string | [string, number];
const letters = (value: string): Entry[] => value.split(' ');
const rows: Entry[][] = [
  ['Esc', ...letters('1 2 3 4 5 6 7 8 9 0 - ='), ['Back', 2], 'Ins'],
  [['Tab', 1.5], ...letters('Q W E R T Y U I O P [ ]'), ['\\', 1.5], 'Del'],
  [['Caps', 1.75], ...letters("A S D F G H J K L ; '"), ['Enter', 2.25], 'PgUp'],
  [['Shift', 2.25], ...letters('Z X C V B N M , . /'), ['Shift R', 1.75], '↑', 'PgDn'],
  [['Ctrl', 1.25], ['Win', 1.25], ['Alt', 1.25], ['Space', 6.25], 'Alt R', 'Fn', 'Ctrl R', '←', '↓', '→'],
];
export const ace68Keys: Ace68Key[] = rows.flatMap((entries, row) => {
  let x = 0;
  return entries.map((entry, index) => {
    const [label, width] = typeof entry === 'string' ? [entry, 1] : entry;
    const key = { id: `${row}-${index}`, label, x, row, width };
    x += width;
    return key;
  });
});
