const fs = require('fs');
const path = require('path');
const logger = require('../libs/logger');
const Script = require('../common/Script');

const util = require('../libs/util');

const MAX_EXECUTION_LOGS = 10;
const EXECUTION_LOGS_DIR = path.join(__dirname, '../data/script-logs');

class ScriptMod {
  constructor () {
    this._ensureLogsDirectory();
  }

  _ensureLogsDirectory () {
    if (!fs.existsSync(EXECUTION_LOGS_DIR)) {
      try {
        fs.mkdirSync(EXECUTION_LOGS_DIR, { recursive: true });
      } catch (e) {
        logger.error('Failed to create execution logs directory:', e);
      }
    }
  }

  _getLogFilePath (scriptId) {
    return path.join(EXECUTION_LOGS_DIR, `${scriptId}.json`);
  }

  _loadExecutionLogs (scriptId) {
    const logFilePath = this._getLogFilePath(scriptId);
    if (!fs.existsSync(logFilePath)) {
      return [];
    }
    try {
      const content = fs.readFileSync(logFilePath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      logger.error(`Failed to load execution logs for script ${scriptId}:`, e);
      return [];
    }
  }

  _saveExecutionLogs (scriptId, logs) {
    this._ensureLogsDirectory();
    const logFilePath = this._getLogFilePath(scriptId);
    try {
      fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
    } catch (e) {
      logger.error(`Failed to save execution logs for script ${scriptId}:`, e);
    }
  }

  addExecutionLog (scriptId, logEntry) {
    const logs = this._loadExecutionLogs(scriptId);
    const entry = {
      scriptId,
      timestamp: logEntry.timestamp || Date.now(),
      exitCode: logEntry.exitCode,
      stdout: logEntry.stdout || '',
      stderr: logEntry.stderr || '',
      duration: logEntry.duration || 0,
      timedOut: logEntry.timedOut || false,
      success: logEntry.success !== undefined ? logEntry.success : (logEntry.exitCode === 0),
      error: logEntry.error || null
    };
    logs.push(entry);
    while (logs.length > MAX_EXECUTION_LOGS) {
      logs.shift();
    }
    this._saveExecutionLogs(scriptId, logs);
  }

  getExecutionLogs (scriptId) {
    this._ensureLogsDirectory();
    return this._loadExecutionLogs(scriptId);
  }

  _deleteExecutionLogs (scriptId) {
    const logFilePath = this._getLogFilePath(scriptId);
    if (fs.existsSync(logFilePath)) {
      try {
        fs.unlinkSync(logFilePath);
      } catch (e) {
        logger.error(`Failed to delete execution logs for script ${scriptId}:`, e);
      }
    }
  }

  _createScriptInstance (scriptSet) {
    return new Script(scriptSet);
  }

  _normalizeConfig (options) {
    const scriptSet = { ...options };
    scriptSet.type = 'inline';
    return scriptSet;
  }

  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const scriptSet = this._normalizeConfig(options);
    scriptSet.id = id;
    fs.writeFileSync(path.join(__dirname, '../data/script/', id + '.json'), JSON.stringify(scriptSet, null, 2));
    if (global.runningScript[id]) global.runningScript[id].destroy();
    if (scriptSet.enable) global.runningScript[id] = this._createScriptInstance(scriptSet);
    return '添加 Script 成功';
  }

  delete (options) {
    this._deleteExecutionLogs(options.id);
    fs.unlinkSync(path.join(__dirname, '../data/script/', options.id + '.json'));
    if (global.runningScript[options.id]) global.runningScript[options.id].destroy();
    return '删除 Script 成功';
  }

  modify (options) {
    const scriptSet = this._normalizeConfig(options);
    fs.writeFileSync(path.join(__dirname, '../data/script/', options.id + '.json'), JSON.stringify(scriptSet, null, 2));
    if (global.runningScript[options.id]) global.runningScript[options.id].destroy();
    if (scriptSet.enable) global.runningScript[options.id] = this._createScriptInstance(scriptSet);
    return '修改 Script 成功';
  }

  get (id) {
    const filePath = path.join(__dirname, '../data/script/', id + '.json');
    if (!fs.existsSync(filePath)) {
      return null;
    }
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      logger.error(`Failed to read script ${id}:`, e);
      return null;
    }
  }

  list () {
    const scriptList = util.listCrontabJavaScript();
    return scriptList;
  }

  async run (options) {
    const startTime = Date.now();
    if (options.id) {
      const scriptConfig = this.get(options.id);
      if (!scriptConfig) {
        return { success: false, error: 'Script not found' };
      }
      options = scriptConfig;
    }
    // Handle inline JavaScript scripts
    if (options.script) {
      try {
        // eslint-disable-next-line no-eval
        const f = eval(options.script);
        await f();
        const duration = Date.now() - startTime;
        if (options.id) {
          this.addExecutionLog(options.id, {
            timestamp: startTime,
            exitCode: 0,
            stdout: 'Script executed successfully',
            stderr: '',
            duration,
            timedOut: false,
            success: true
          });
        }
        return { success: true, duration };
      } catch (e) {
        logger.error(e);
        const duration = Date.now() - startTime;
        if (options.id) {
          this.addExecutionLog(options.id, {
            timestamp: startTime,
            exitCode: 1,
            stdout: '',
            stderr: e.message,
            duration,
            timedOut: false,
            success: false,
            error: e.message
          });
        }
        return { success: false, error: e.message };
      }
    }
    return { success: false, error: 'No script content provided' };
  }
}

module.exports = ScriptMod;
