import { useTestDatabase } from './test-env';

// Runs before each test file imports src/: point the app at the test database.
useTestDatabase();
