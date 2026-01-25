/**
 * Base Controller
 *
 * 控制器基类，提供通用的 CRUD 操作和错误处理
 * 所有规则相关的控制器都可以继承此类以减少重复代码
 */

const logger = require('../libs/logger');

class BaseController {
  /**
   * 构造函数
   * @param {Object} model - 数据模型实例
   * @param {string} entityName - 实体名称，用于日志和错误消息
   */
  constructor (model, entityName = 'Entity') {
    this.model = model;
    this.entityName = entityName;
  }

  /**
   * 处理请求并统一返回格式
   * @param {Function} operation - 要执行的操作函数
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {string} [successMessage] - 成功消息（可选）
   */
  async _handleRequest (operation, req, res, successMessage = '操作成功') {
    try {
      const result = await operation(req);
      res.send({
        success: true,
        message: successMessage,
        ...(result !== undefined && { data: result })
      });
    } catch (e) {
      logger.error(`${this.entityName} 操作失败:`, e);

      // 如果是鉴权相关的错误，返回 401
      if (e.message && e.message.includes('鉴权')) {
        res.status(401);
      } else {
        res.status(500);
      }

      res.send({
        success: false,
        message: e.message || '操作失败'
      });
    }
  }

  /**
   * 添加实体
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async add (req, res) {
    await this._handleRequest(
      () => this.model.add(req.body),
      req,
      res,
      '添加成功'
    );
  }

  /**
   * 删除实体
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async delete (req, res) {
    await this._handleRequest(
      () => this.model.delete(req.body),
      req,
      res,
      '删除成功'
    );
  }

  /**
   * 修改实体
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async modify (req, res) {
    await this._handleRequest(
      () => this.model.modify(req.body),
      req,
      res,
      '修改成功'
    );
  }

  /**
   * 列出所有实体
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async list (req, res) {
    await this._handleRequest(
      () => this.model.list(),
      req,
      res
    );
  }
}

module.exports = BaseController;
