#!/usr/bin/env node

const path = require('path');
const { getAiDir } = require('../lib/utils');
const { readJson } = require('../lib/file-ops');
const logger = require('../lib/logger');

/**
 * System Health Check
 * Verifies the integrity of the .ai/ environment.
 */
async function healthCheck() {
  logger.info('Starting system health check...');
  let issues = 0;

  const aiDir = getAiDir();

  // 1. Verify Configuration
  try {
    const config = await readJson(path.join(aiDir, 'config.json'));
    logger.success('Main configuration loaded');
    if (!config.agents?.enabled) logger.warn('Agents are globally disabled');
  } catch (err) {
    logger.error('Main configuration (config.json) missing or invalid');
    issues++;
  }

  // 2. Verify Hooks
  try {
    await readJson(path.join(aiDir, 'hooks', 'hooks.json'));
    logger.success('Hooks configuration loaded');
  } catch (err) {
    logger.error('Hooks configuration (hooks.json) missing or invalid');
    issues++;
  }

  // 3. Verify MCP
  try {
    await readJson(path.join(aiDir, 'mcp', 'mcp-config.json'));
    logger.success('MCP configuration loaded');
  } catch (err) {
    logger.error('MCP configuration (mcp-config.json) missing or invalid');
    issues++;
  }

  // 4. Summary
  if (issues === 0) {
    logger.success('System health check passed: All systems functional.');
  } else {
    logger.warn(`System health check finished with ${issues} issue(s).`);
    process.exit(1);
  }
}

healthCheck().catch(err => {
  logger.error('Health check failed unexpectedly:', err);
  process.exit(1);
});
