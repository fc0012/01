/**
 * LinkRule Controller
 *
 * 链接规则管理控制器
 *
 * 注意：此功能后端已完整实现，但前端暂未提供界面。
 * 后端 API 可正常使用，主要用于管理种子文件的链接/硬链接规则。
 * 此功能在 TorrentMod 中被大量使用。
 */

const BaseController = require('./BaseController');
const LinkRuleMod = require('../model/LinkRuleMod');

class LinkRule extends BaseController {
  constructor () {
    super(new LinkRuleMod(), '链接规则');
  }
}

module.exports = LinkRule;
