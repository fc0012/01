const fs = require('fs');
const path = require('path');

const util = require('../libs/util');
const logger = require('../libs/logger');

class DeleteRuleMod {
  constructor () {
    this.ruleDir = path.join(__dirname, '../data/rule/delete/');
    this.ensureDir();
  }

  ensureDir () {
    if (!fs.existsSync(this.ruleDir)) {
      try {
        fs.mkdirSync(this.ruleDir, { recursive: true });
        logger.info('删种规则目录创建成功:', this.ruleDir);
      } catch (mkdirErr) {
        logger.error('创建删种规则目录失败:', mkdirErr);
        throw new Error('创建规则目录失败');
      }
    }
  }

  filterValidOptions (options) {
    const filtered = {};
    for (const key of Object.keys(options)) {
      if (options[key] !== undefined && options[key] !== '') {
        filtered[key] = options[key];
      }
    }
    return filtered;
  }

  getRulePath (id) {
    return path.join(this.ruleDir, id + '.json');
  }

  reloadAffectedClients (ruleId) {
    Object.values(global.runningClient)
      .filter(client =>
        (client._deleteRules?.includes(ruleId) || client._rejectDeleteRules?.includes(ruleId)) &&
        client.autoDeleteJob
      )
      .forEach(client => client.reloadDeleteRule());
  }

  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const deleteRuleSet = { id, ...this.filterValidOptions(options) };
    fs.writeFileSync(this.getRulePath(id), JSON.stringify(deleteRuleSet, null, 2));
    return '添加规则成功';
  };

  delete (options) {
    const filePath = this.getRulePath(options.id);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return '删除规则成功';
    }
    throw new Error('规则文件不存在');
  };

  modify (options) {
    const filePath = this.getRulePath(options.id);
    if (!fs.existsSync(filePath)) {
      throw new Error('规则文件不存在');
    }

    const deleteRuleSet = this.filterValidOptions(options);
    fs.writeFileSync(filePath, JSON.stringify(deleteRuleSet, null, 2));
    this.reloadAffectedClients(options.id);
    return '修改规则成功';
  };

  list () {
    const deleteRuleList = util.listDeleteRule();
    const clientList = util.listClient();

    return deleteRuleList.map(deleteRule => ({
      ...deleteRule,
      used: clientList.some(client =>
        client.deleteRules?.includes(deleteRule.id) ||
        client.rejectDeleteRules?.includes(deleteRule.id)
      )
    }));
  };
}

module.exports = DeleteRuleMod;
