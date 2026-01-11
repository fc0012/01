const cron = require('node-cron');
const logger = require('../libs/logger');

/**
 * Script class for managing scheduled script execution.
 * Supports inline JavaScript scripts only.
 */
class Script {
  /**
   * Create a new Script instance
   * @param {Object} script - Script configuration
   * @param {string} script.id - Unique script identifier
   * @param {string} script.alias - Human-readable script name
   * @param {string} script.cron - Cron expression for scheduling
   * @param {boolean} [script.enable=true] - Whether the script is enabled
   * @param {string} [script.script] - Inline JavaScript code
   */
  constructor (script) {
    this.id = script.id;
    this.alias = script.alias;
    this.cron = script.cron;
    this.enable = script.enable !== false;
    this.type = 'inline';

    // Store the full config for reference
    this._config = script;

    // For inline scripts, use the existing behavior
    this.script = script.script;

    // Only schedule if enabled
    if (this.enable && this.cron) {
      this._startCronJob();
    } else {
      this.job = null;
    }
  }

  /**
   * Start the cron job for inline script execution
   * @private
   */
  _startCronJob () {
    if (this.job) {
      this.job.stop();
    }

    // eslint-disable-next-line no-eval
    this.job = cron.schedule(this.cron, async () => {
      // Double-check enable status before execution
      if (!this.enable) {
        return;
      }
      try {
        // eslint-disable-next-line no-eval
        const f = eval(this.script);
        await f();
      } catch (e) {
        logger.error(`Script [${this.alias}] execution error:`, e);
      }
    });
  }

  /**
   * Execute the script manually (outside of cron schedule)
   * @returns {Promise<Object>} Execution result
   */
  async execute () {
    // Prevent execution if disabled
    if (!this.enable) {
      return {
        success: false,
        error: 'Script is disabled'
      };
    }

    // Execute inline script
    try {
      // eslint-disable-next-line no-eval
      const f = eval(this.script);
      await f();
      return { success: true };
    } catch (e) {
      logger.error(`Script [${this.alias}] execution error:`, e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Check if the script is enabled
   * @returns {boolean}
   */
  isEnabled () {
    return this.enable;
  }

  /**
   * Enable the script and start scheduling
   */
  setEnabled (enabled) {
    this.enable = enabled;

    // For inline scripts, start or stop the cron job
    if (enabled && this.cron && !this.job) {
      this._startCronJob();
    } else if (!enabled && this.job) {
      this.job.stop();
      this.job = null;
    }
  }

  /**
   * Get execution logs (not available for inline scripts)
   * @returns {Array} Execution logs
   */
  getExecutionLogs () {
    return [];
  }

  /**
   * Destroy the script instance and clean up resources
   */
  destroy () {
    // Stop cron job for inline scripts
    if (this.job) {
      this.job.stop();
      this.job = null;
    }

    // Remove from global registry
    if (global.runningScript && global.runningScript[this.id]) {
      delete global.runningScript[this.id];
    }
  }
}

module.exports = Script;
