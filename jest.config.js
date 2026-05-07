module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    // Esto ayuda si usas alias en tus rutas
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};