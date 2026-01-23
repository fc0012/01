const BaseController = require('./BaseController');
const RaceRuleMod = require('../model/RaceRuleMod');

/**
 * RaceRule Controller
 *
 * 选种规则管理控制器
 * 继承自 BaseController，提供选种规则的 CRUD 操作
 */
class RaceRule extends BaseController {
  constructor () {
    super(new RaceRuleMod(), '选种规则');
  }
}

module.exports = RaceRule;
