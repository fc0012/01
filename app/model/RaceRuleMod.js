const fs = require('fs');
const path = require('path');

const util = require('../libs/util');
const logger = require('../libs/logger');

class RaceRuleMod {
  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const raceRuleSet = {
      id
    };
    for (const key of Object.keys(options)) {
      if (options[key] !== undefined && options[key] !== '') {
        raceRuleSet[key] = options[key];
      }
    }
    const ruleDir = path.join(__dirname, '../data/rule/race/');
    if (!fs.existsSync(ruleDir)) {
      try {
        fs.mkdirSync(ruleDir, { recursive: true });
        logger.info('选种规则目录创建成功:', ruleDir);
      } catch (mkdirErr) {
        logger.error('创建选种规则目录失败:', mkdirErr);
        throw new Error('创建规则目录失败');
      }
    }
    fs.writeFileSync(path.join(ruleDir, id + '.json'), JSON.stringify(raceRuleSet, null, 2));
    return '添加规则成功';
  };

  delete (options) {
    const filePath = path.join(__dirname, '../data/rule/race/', options.id + '.json');
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return '删除规则成功';
    } else {
      throw new Error('规则文件不存在');
    }
  };

  modify (options) {
    const raceRuleSet = {};
    for (const key of Object.keys(options)) {
      if (options[key] !== undefined && options[key] !== '') {
        raceRuleSet[key] = options[key];
      }
    }
    const filePath = path.join(__dirname, '../data/rule/race/', options.id + '.json');
    if (!fs.existsSync(filePath)) {
      throw new Error('规则文件不存在');
    }
    fs.writeFileSync(filePath, JSON.stringify(raceRuleSet, null, 2));
    return '修改规则成功';
  };

  list () {
    const raceRuleList = util.listRaceRule();
    const raceRuleSetList = util.listRaceRuleSet();
    for (const raceRule of raceRuleList) {
      raceRule.used = !!raceRuleSetList.some(item => item.raceRules.indexOf(raceRule.id) !== -1);
    }
    return raceRuleList;
  };
}

module.exports = RaceRuleMod;
