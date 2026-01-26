const { colors } = require('./utils');

function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  let color = colors.reset;
  
  switch(level) {
    case 'INFO': color = colors.cyan; break;
    case 'WARN': color = colors.yellow; break;
    case 'ERROR': color = colors.red; break;
    case 'SUCCESS': color = colors.green; break;
  }

  console.log(`${colors.reset}[${timestamp}] ${color}${level}${colors.reset}: ${message}`, ...args);
}

module.exports = {
  info: (msg, ...args) => log('INFO', msg, ...args),
  warn: (msg, ...args) => log('WARN', msg, ...args),
  error: (msg, ...args) => log('ERROR', msg, ...args),
  success: (msg, ...args) => log('SUCCESS', msg, ...args),
};
