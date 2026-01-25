const fs = require('fs');
const path = require('path');

const util = require('../libs/util');
const logger = require('../libs/logger');

class RssRuleMod {
  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const rssRuleSet = {
      id
    };
    for (const key of Object.keys(options)) {
      if (options[key] !== undefined && options[key] !== '') {
        rssRuleSet[key] = options[key];
      }
    }
    const ruleDir = path.join(__dirname, '../data/rule/rss/');
    if (!fs.existsSync(ruleDir)) {
      try {
        fs.mkdirSync(ruleDir, { recursive: true });
        logger.info('RSS规则目录创建成功:', ruleDir);
      } catch (mkdirErr) {
        logger.error('创建RSS规则目录失败:', mkdirErr);
        throw new Error('创建规则目录失败');
      }
    }
    fs.writeFileSync(path.join(ruleDir, id + '.json'), JSON.stringify(rssRuleSet, null, 2));
    return '添加 Rss 规则成功';
  };

  delete (options) {
    const filePath = path.join(__dirname, '../data/rule/rss/', options.id + '.json');
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return '删除规则成功';
    } else {
      throw new Error('规则文件不存在');
    }
  };

  modify (options) {
    const rssRuleSet = {};
    for (const key of Object.keys(options)) {
      if (options[key] !== undefined && options[key] !== '') {
        rssRuleSet[key] = options[key];
      }
    }
    const filePath = path.join(__dirname, '../data/rule/rss/', options.id + '.json');
    if (!fs.existsSync(filePath)) {
      throw new Error('规则文件不存在');
    }
    fs.writeFileSync(filePath, JSON.stringify(rssRuleSet, null, 2));
    Object.keys(global.runningRss)
      .map(item => global.runningRss[item])
      .filter(item => item._rejectRules.some(i => i === options.id) || item._acceptRules.some(i => i === options.id))
      .forEach(item => item.reloadRssRule());
    return '修改 Rss 规则成功';
  };

  list () {
    const rssRuleList = util.listRssRule();
    const rssList = util.listRss();
    for (const rssRule of rssRuleList) {
      rssRule.used = rssList.some(item => (item._rejectRules || []).indexOf(rssRule.id) !== -1 || (item._acceptRules || []).indexOf(rssRule.id) !== -1);
    }
    return rssRuleList;
  };
}

module.exports = RssRuleMod;
