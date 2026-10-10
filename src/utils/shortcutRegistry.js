// Keep every DogeUB app keyboard shortcut in this central catalog.
// When adding a shortcut to an app, add its description here too.
const shortcutRegistry = [
  {
    app: 'DOGEUB Section Switcher',
    category: 'Navigation',
    keys: ['Alt', 'Shift', 'C'],
    title: 'Switch sections and browser tabs',
    description: 'Opens a searchable switcher for Apps, Games, Recommended, Files, Settings, and individual built-in browser tabs.',
    route: '/',
    note: 'Use the arrow keys to move, Enter to open a destination, and Escape to close.',
  },
  {
    app: 'Panic Button',
    category: 'Safety',
    keys: ['Ctrl', 'C'],
    title: 'Panic redirect',
    description: 'Quickly opens Google Classroom when no text is selected.',
    route: '/',
    note: 'Ignored while typing or when text is selected so normal copying still works.',
  },
  {
    app: 'DogeUB Lock Screen',
    category: 'Security',
    keys: ['Ctrl', 'L'],
    title: 'Lock DogeUB',
    description: 'Opens the DogeUB lock screen.',
    route: '/',
    note: 'Locks DogeUB only; it does not lock Windows itself. Browsers may reserve Ctrl+L for the address bar.',
  },
];

export default shortcutRegistry;
