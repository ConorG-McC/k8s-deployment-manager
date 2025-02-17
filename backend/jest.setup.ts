if (process.env.NODE_ENV === 'test') {
  global.console.log = jest.fn();
  global.console.error = jest.fn();
  global.console.warn = jest.fn();
}
