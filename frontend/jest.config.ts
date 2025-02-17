module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  verbose: true,
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy', // Optional: if you want to mock CSS modules
  },
  setupFiles: ['<rootDir>/jest.setup.ts'], // Add this line
};
