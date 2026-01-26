const path = require('path');
const { getAiDir, resolvePath } = require('../lib/utils');
const { ensureDir, writeFile } = require('../lib/file-ops');
const logger = require('../lib/logger');

const STRUCTURE = [
  'agents',
  'skills/coding-standards',
  'skills/workflows',
  'skills/domain-knowledge',
  'skills/security',
  'rules',
  'commands',
  'hooks/scripts',
  'mcp/servers',
  'contexts',
  'templates',
  'scripts/lib',
  'scripts/setup',
  'scripts/validation',
  'scripts/maintenance',
  'examples',
];

async function init() {
  logger.info('Initializing .ai environment...');
  
  const aiDir = getAiDir();
  
  for (const dir of STRUCTURE) {
    const fullPath = path.join(aiDir, dir);
    await ensureDir(fullPath);
    logger.info(`Ensure directory: ${dir}`);
  }

  logger.success('.ai environment initialized successfully!');
}

init().catch(err => {
  logger.error('Initialization failed:', err);
  process.exit(1);
});
