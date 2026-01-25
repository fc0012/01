const fs = require('fs');
const path = require('path');

const util = require('../libs/util');
const logger = require('../libs/logger');

class DeleteRuleMod {
  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const deleteRuleSet = {
      id
    };
    for (const key of Object.keys(options)) {
      if (options[key] !== undefined && options[key] !== '') {
        deleteRuleSet[key] = options[key];
      }
    }
    const ruleDir = path.join(__dirname, '../data/rule/delete/');
    // 确保目录存在
    if (!fs.existsSync(ruleDir)) {
      try {
        fs.mkdirSync(ruleDir, { recursive: true });
        logger.info('删种规则目录创建成功:', ruleDir);
      } catch (mkdirErr) {
        logger.error('创建删种规则目录失败:', mkdirErr);
        throw new Error('创建规则目录失败');
      }
    }
    fs.writeFileSync(path.join(ruleDir, id + '.json'), JSON.stringify(deleteRuleSet, null, 2));
    return '添加规则成功';
  };

  delete (options) {
    const filePath = path.join(__dirname, '../data/rule/delete/', options.id + '.json');
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return '删除规则成功';
    } else {
      throw new Error('规则文件不存在');
    }
  };

  modify (options) {
    const deleteRuleSet = {};
    for (const key of Object.keys(options)) {
      if (options[key] !== undefined && options[key] !== '') {
        deleteRuleSet[key] = options[key];
      }
    }
    const filePath = path.join(__dirname, '../data/rule/delete/', options.id + '.json');
    if (!fs.existsSync(filePath)) {
      throw new Error('规则文件不存在');
    }
    fs.writeFileSync(filePath, JSON.stringify(deleteRuleSet, null, 2));
    Object.keys(global.runningClient)
      .map(item => global.runningClient[item])
      .filter(item => ((item._deleteRules.some(i => i === options.id) || item._rejectDeleteRules.some(i => i === options.id)) && !!item.autoDeleteJob))
      .forEach(item => item.reloadDeleteRule());
    return '修改规则成功';
  };

  list () {
    const deleteRuleList = util.listDeleteRule();
    const clientList = util.listClient();
    for (const deleteRule of deleteRuleList) {
      deleteRule.used = clientList.some(item => (item.deleteRules.indexOf(deleteRule.id) !== -1 || (item.rejectDeleteRules || []).indexOf(deleteRule.id) !== -1));
    }
    return deleteRuleList;
  };
}

module.exports = DeleteRuleMod;
