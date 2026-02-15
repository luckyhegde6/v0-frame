// Phase 2: Server Initialization
// Starts job runner on server startup

import { startJobRunner } from '@/lib/jobs/runner';
import { initializeJobHandlers } from '@/lib/jobs/handlers';

let jobRunnerStarted = false;

/**
 * Initialize server-side services
 * Called once during Next.js startup
 */
export async function initializeServer() {
  if (jobRunnerStarted) {
    return;
  }

  console.log('[Server Init] Starting Phase 2 job runner...');

  // 1. Register job handlers
  initializeJobHandlers();

  // 2. Start the job runner
  startJobRunner(
    5,      // batch size
    5000    // poll interval (5 seconds for development)
  );

  jobRunnerStarted = true;
  console.log('[Server Init] Server initialization complete');
}
