const os = require('os');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Cross-platform path resolver
 */
function resolvePath(...segments) {
  return path.resolve(...segments);
}

/**
 * Gets the root directory of the project
 */
function getProjectRoot() {
  return process.cwd();
}

/**
 * Getting the .ai directory path
 */
function getAiDir() {
  return path.join(getProjectRoot(), '.ai');
}

module.exports = {
  colors,
  resolvePath,
  getProjectRoot,
  getAiDir,
};
