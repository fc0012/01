const fs = require('fs');
const path = require('path');
const logger = require('../libs/logger');
const Script = require('../common/Script');
const ExternalScript = require('../common/ExternalScript');

const util = require('../libs/util');

const VALID_INTERPRETERS = ['python', 'python3', 'node', 'bash', 'sh', 'custom'];
const DEFAULT_TIMEOUT = 300;
const MAX_EXECUTION_LOGS = 10;
const EXECUTION_LOGS_DIR = path.join(__dirname, '../data/script-logs');
const TEMP_SCRIPTS_DIR = path.join(__dirname, '../data/temp-scripts');

class ScriptMod {
  constructor () {
    this._ensureLogsDirectory();
    this._ensureTempScriptsDirectory();
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

  _ensureTempScriptsDirectory () {
    if (!fs.existsSync(TEMP_SCRIPTS_DIR)) {
      try {
        fs.mkdirSync(TEMP_SCRIPTS_DIR, { recursive: true });
      } catch (e) {
        logger.error('Failed to create temp scripts directory:', e);
      }
    }
  }

  _getExtensionForInterpreter (interpreter) {
    const extensions = {
      python: '.py',
      python3: '.py',
      node: '.js',
      bash: '.sh',
      sh: '.sh'
    };
    return extensions[interpreter] || '.sh';
  }

  _createTempScript (scriptId, codeContent, interpreter) {
    this._ensureTempScriptsDirectory();
    const ext = this._getExtensionForInterpreter(interpreter);
    const tempPath = path.join(TEMP_SCRIPTS_DIR, `${scriptId}${ext}`);
    fs.writeFileSync(tempPath, codeContent, { mode: 0o755 });
    return tempPath;
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
    if (scriptSet.type === 'external') {
      return new ExternalScript(scriptSet);
    }
    if (scriptSet.type === 'code') {
      const tempPath = this._createTempScript(scriptSet.id, scriptSet.codeContent, scriptSet.interpreter);
      return new ExternalScript({
        ...scriptSet,
        scriptPath: tempPath,
        workingDir: TEMP_SCRIPTS_DIR
      });
    }
    return new Script(scriptSet);
  }

  _normalizeConfig (options) {
    const scriptSet = { ...options };
    if (!scriptSet.type) {
      scriptSet.type = 'inline';
    }
    if (scriptSet.type === 'external') {
      scriptSet.scriptPath = scriptSet.scriptPath || '';
      scriptSet.workingDir = scriptSet.workingDir || '';
      scriptSet.interpreter = VALID_INTERPRETERS.includes(scriptSet.interpreter) ? scriptSet.interpreter : 'bash';
      scriptSet.customCommand = scriptSet.customCommand || '';
      scriptSet.envVars = Array.isArray(scriptSet.envVars) ? scriptSet.envVars : [];
      scriptSet.timeout = typeof scriptSet.timeout === 'number' && scriptSet.timeout > 0 ? scriptSet.timeout : DEFAULT_TIMEOUT;
    }
    if (scriptSet.type === 'code') {
      scriptSet.codeContent = scriptSet.codeContent || '';
      scriptSet.interpreter = VALID_INTERPRETERS.includes(scriptSet.interpreter) ? scriptSet.interpreter : 'python3';
      scriptSet.envVars = Array.isArray(scriptSet.envVars) ? scriptSet.envVars : [];
      scriptSet.timeout = typeof scriptSet.timeout === 'number' && scriptSet.timeout > 0 ? scriptSet.timeout : DEFAULT_TIMEOUT;
    }
    return scriptSet;
  }

  validateScriptPath (scriptPath) {
    if (!scriptPath || typeof scriptPath !== 'string') {
      return { valid: false, error: 'Script path is required' };
    }
    const normalizedPath = path.resolve(scriptPath);
    if (!fs.existsSync(normalizedPath)) {
      return { valid: false, error: `Script file not found: ${scriptPath}` };
    }
    try {
      const stats = fs.statSync(normalizedPath);
      if (!stats.isFile()) {
        return { valid: false, error: `Path is not a file: ${scriptPath}` };
      }
    } catch (e) {
      return { valid: false, error: `Cannot access script file: ${e.message}` };
    }
    return { valid: true };
  }

  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const scriptSet = this._normalizeConfig(options);
    scriptSet.id = id;
    if (scriptSet.type === 'external' && scriptSet.scriptPath) {
      const validation = this.validateScriptPath(scriptSet.scriptPath);
      if (!validation.valid) {
        return { success: false, message: validation.error };
      }
    }
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
    if (scriptSet.type === 'external' && scriptSet.scriptPath) {
      const validation = this.validateScriptPath(scriptSet.scriptPath);
      if (!validation.valid) {
        return { success: false, message: validation.error };
      }
    }
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
      if (scriptConfig.type === 'external') {
        try {
          const externalScript = new ExternalScript(scriptConfig);
          const result = await externalScript.execute();
          externalScript.destroy();
          const logEntry = {
            timestamp: startTime,
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
            duration: result.duration,
            timedOut: result.timedOut,
            success: result.exitCode === 0
          };
          this.addExecutionLog(options.id, logEntry);
          return {
            success: result.exitCode === 0,
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
            duration: result.duration,
            timedOut: result.timedOut
          };
        } catch (e) {
          logger.error('External script execution error:', e);
          this.addExecutionLog(options.id, {
            timestamp: startTime,
            exitCode: 1,
            stdout: '',
            stderr: e.message,
            duration: Date.now() - startTime,
            timedOut: false,
            success: false,
            error: e.message
          });
          return { success: false, error: e.message };
        }
      }
      if (scriptConfig.type === 'code') {
        try {
          const tempPath = this._createTempScript(scriptConfig.id, scriptConfig.codeContent, scriptConfig.interpreter);
          const externalScript = new ExternalScript({
            ...scriptConfig,
            scriptPath: tempPath,
            workingDir: TEMP_SCRIPTS_DIR
          });
          const result = await externalScript.execute();
          externalScript.destroy();
          const logEntry = {
            timestamp: startTime,
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
            duration: result.duration,
            timedOut: result.timedOut,
            success: result.exitCode === 0
          };
          this.addExecutionLog(options.id, logEntry);
          return {
            success: result.exitCode === 0,
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
            duration: result.duration,
            timedOut: result.timedOut
          };
        } catch (e) {
          logger.error('Inline code execution error:', e);
          this.addExecutionLog(options.id, {
            timestamp: startTime,
            exitCode: 1,
            stdout: '',
            stderr: e.message,
            duration: Date.now() - startTime,
            timedOut: false,
            success: false,
            error: e.message
          });
          return { success: false, error: e.message };
        }
      }
      options = scriptConfig;
    }
    // Handle unsaved code type scripts (direct execution)
    if (options.type === 'code' && options.codeContent) {
      try {
        const tempId = 'temp_' + Date.now();
        const tempPath = this._createTempScript(tempId, options.codeContent, options.interpreter || 'python3');
        const externalScript = new ExternalScript({
          id: tempId,
          alias: options.alias || 'Temp Script',
          scriptPath: tempPath,
          workingDir: TEMP_SCRIPTS_DIR,
          interpreter: options.interpreter || 'python3',
          envVars: options.envVars || [],
          timeout: options.timeout || 300
        });
        const result = await externalScript.execute();
        externalScript.destroy();
        // Clean up temp file
        try {
          fs.unlinkSync(tempPath);
        } catch (e) {
          // Ignore cleanup errors
        }
        return {
          success: result.exitCode === 0,
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
          duration: result.duration,
          timedOut: result.timedOut
        };
      } catch (e) {
        logger.error('Temp code execution error:', e);
        return { success: false, error: e.message };
      }
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
