const path = require('path');
const { getAiDir } = require('../lib/utils');
const { readJson } = require('../lib/file-ops');
const logger = require('../lib/logger');

async function validate() {
  logger.info('Validating .ai configuration...');
  
  const aiDir = getAiDir();
  const configPath = path.join(aiDir, 'config.json');
  
  try {
    const config = await readJson(configPath);
    
    // Schema Validation (Basic)
    if (!config.version) throw new Error('Missing version');
    if (!config.project) throw new Error('Missing project metadata');
    if (!config.project.phase) throw new Error('Missing project phase');
    if (!config.agents) throw new Error('Missing agents configuration');
    
    logger.success('Configuration is valid!');
    return true;
  } catch (err) {
    logger.error('Invalid configuration:', err.message);
    process.exit(1);
  }
}

validate();
