// Keep every DogeUB app keyboard shortcut in this central catalog.
// When adding a shortcut to an app, add its description here too.
const shortcutRegistry = [
  {
    app: 'Doge Capture',
    category: 'Capture',
    keys: ['Ctrl', 'Alt', 'P'],
    title: 'Take screenshot',
    description: 'Save a PNG screenshot to DogeFiler → Screenshots.',
    route: '/capture',
    note: 'Screen sharing must already be active.',
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
