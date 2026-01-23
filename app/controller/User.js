/**
 * User Controller
 *
 * 用户管理控制器
 * 处理用户登录、登出和获取用户信息
 */

const logger = require('../libs/logger');
const UserMod = require('../model/UserMod');
const { asyncHandler } = require('../middleware/errorHandler');

const userMod = new UserMod();

class User {
  async login (req, res) {
    const options = req.body;
    try {
      const r = userMod.login(options);
      req.session.user = r;
      logger.info('登录成功, IP:', req.userIp);
      res.send({
        success: true
      });
    } catch (e) {
      logger.error('登录失败, IP:', req.userIp, e.message);
      res.send({
        success: false,
        message: e.message
      });
    }
  };

  logout (req, res) {
    req.session.destroy();
    res.send({
      success: true
    });
  };

  async get (req, res) {
    res.send({
      success: true,
      data: await userMod.get()
    });
  }
}
module.exports = User;
