export const TestData = {
  todos: {
    single: 'Learn Playwright automation',
    multiple: [
      'Write comprehensive tests',
      'Set up CI/CD pipeline',
      'Document test results',
      'Review code coverage',
    ],
    long: 'This is a very long todo item that tests how the application handles longer text content in todo items',
    special: 'Todo with special chars: @#$%^&*()',
    numbers: '123 Todo with numbers 456',
    empty: '',
    whitespace: '   ',
  },

  randomTodo(): string {
    const adjectives = ['important', 'urgent', 'simple', 'complex', 'quick'];
    const tasks = ['task', 'item', 'job', 'work', 'project'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const task = tasks[Math.floor(Math.random() * tasks.length)];
    return `${adj} ${task} ${Date.now()}`;
  },
};
