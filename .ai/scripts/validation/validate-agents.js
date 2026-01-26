const fs = require('fs/promises');
const path = require('path');
const { getAiDir } = require('../lib/utils');
const { walkDir } = require('../lib/file-ops');
const logger = require('../lib/logger');

const REQUIRED_FRONTMATTER = [
  'name',
  'description',
  'model',
  'tools',
  'constraints'
];

async function validateAgentFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  
  // Basic frontmatter check
  if (!content.startsWith('---')) {
    throw new Error('Missing frontmatter');
  }

  // Check required fields (naive parsing)
  for (const field of REQUIRED_FRONTMATTER) {
    if (!content.includes(`${field}:`)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  logger.success(`Valid agent definition: ${path.basename(filePath)}`);
}

async function validate() {
  logger.info('Validating agent definitions...');
  
  const agentsDir = path.join(getAiDir(), 'agents');
  let hasError = false;

  await walkDir(agentsDir, async (filePath) => {
    if (!filePath.endsWith('.md')) return;
    
    try {
      await validateAgentFile(filePath);
    } catch (err) {
      logger.error(`Invalid agent definition ${path.basename(filePath)}:`, err.message);
      hasError = true;
    }
  });

  if (hasError) process.exit(1);
  logger.success('All agents validated!');
}

validate();
