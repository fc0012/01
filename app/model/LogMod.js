const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../libs/logger');

class LogMod {
  get (options) {
    const logFile = path.join(__dirname, `../../logs/app-${options.type}.log`);
    const log = execSync(`tail -n 2000 ${logFile}`).toString();
    return log;
  };

  clear () {
    const logsDir = path.join(__dirname, '../../logs');
    const files = fs.readdirSync(logsDir);
    for (const file of files) {
      const filePath = path.join(logsDir, file);
      if (path.extname(file) === '.gz') {
        // 删除压缩的历史日志文件
        logger.info('删除日志文件', file);
        fs.unlinkSync(filePath);
      } else if (path.extname(file) === '.log') {
        // 清空当前日志文件内容
        logger.info('清空日志文件', file);
        fs.writeFileSync(filePath, '');
      }
    }
    return '删除日志文件成功, 详细情况查看日志';
  };
}

module.exports = LogMod;
