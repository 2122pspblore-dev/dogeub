// Keep every DogeUB app keyboard shortcut in this central catalog.
// When adding a shortcut to an app, add its description here too.
const shortcutRegistry = [
  {
    app: 'Doge Capture',
    category: 'Capture',
    keys: ['Alt', 'Shift', 'S'],
    title: 'Take screenshot',
    description: 'Save a PNG screenshot to DogeFiler → Screenshots.',
    route: '/capture',
    note: 'Screen sharing must already be active.',
  },
  {
    app: 'Doge Capture',
    category: 'Capture',
    keys: ['Alt', 'Shift', 'R'],
    title: 'Start / stop screen recording',
    description: 'Toggle screen recording; recordings save to DogeFiler → Videos.',
    route: '/capture',
    note: 'Screen sharing must already be active.',
  },
];

export default shortcutRegistry;
