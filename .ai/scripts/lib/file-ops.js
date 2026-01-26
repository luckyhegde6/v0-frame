const fs = require('fs/promises');
const path = require('path');

/**
 * Ensures a directory exists
 */
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Writes a file safely
 */
async function writeFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
}

/**
 * Reads a JSON file
 */
async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Walks a directory recursively
 */
async function walkDir(dir, callback) {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      await walkDir(filePath, callback);
    } else {
      await callback(filePath);
    }
  }
}

module.exports = {
  ensureDir,
  writeFile,
  readJson,
  walkDir,
};
