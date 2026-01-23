const BaseController = require('./BaseController');
const DeleteRuleMod = require('../model/DeleteRuleMod');

/**
 * DeleteRule Controller
 *
 * 删种规则管理控制器
 * 继承自 BaseController，提供删种规则的 CRUD 操作
 */
class DeleteRule extends BaseController {
  constructor () {
    super(new DeleteRuleMod(), '删种规则');
  }
}

module.exports = DeleteRule;
