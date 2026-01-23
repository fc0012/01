/**
 * RaceRuleSet Controller
 *
 * 选种规则集管理控制器
 *
 * 注意：此功能后端已完整实现，但前端暂未提供界面。
 * 后端 API 可正常使用，主要用于管理多个选种规则的组合。
 */

const BaseController = require('./BaseController');
const RaceRuleSetMod = require('../model/RaceRuleSetMod');

class RaceRuleSet extends BaseController {
  constructor () {
    super(new RaceRuleSetMod(), '选种规则集');
  }
}

module.exports = RaceRuleSet;
