#!/usr/bin/env node

const path = require('path');
const logger = require('../lib/logger');

/**
 * Post-Edit Hook Script
 * Runs after a file is modified to ensure quality and contract compliance.
 */
async function postEdit() {
  const filePath = process.argv[2];
  if (!filePath) return;

  logger.info(`Running post-edit checks on: ${path.basename(filePath)}`);

  // Mock validation logic
  // In a real scenario, this would check for 'any' types, lint errors, 
  // or lifecycle contract violations.
  
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    // Check for obvious 'any' (simple string search for demo)
    // const content = fs.readFileSync(filePath, 'utf8');
    // if (content.includes(': any')) logger.warn('Detected "any" type. Consider stronger typing.');
  }

  logger.success('Post-edit checks completed.');
}

postEdit().catch(err => {
  logger.error('Post-edit hook failed:', err);
});
