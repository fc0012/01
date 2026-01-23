const BaseController = require('./BaseController');
const RssRuleMod = require('../model/RssRuleMod');

/**
 * RssRule Controller
 *
 * RSS 规则管理控制器
 * 继承自 BaseController，提供 RSS 规则的 CRUD 操作
 */
class RssRule extends BaseController {
  constructor () {
    super(new RssRuleMod(), 'RSS 规则');
  }
}

module.exports = RssRule;
