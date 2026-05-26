import 'dotenv/config';
import { createAppAndServer } from './app';
import { getPort, validateRequiredEnv } from './config/env';

validateRequiredEnv();

const PORT = getPort();

const httpServer = createAppAndServer();

httpServer.listen(PORT, () => {
  console.log(`FIFA League API listening on port ${PORT}`);
  console.log('Socket.IO ready for realtime updates');
});
