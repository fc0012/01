/**
 * User Controller
 *
 * 用户管理控制器
 * 处理用户登录、登出和获取用户信息
 */

const logger = require('../libs/logger');
const UserMod = require('../model/UserMod');

const userMod = new UserMod();

class User {
  async login (req, res) {
    const options = req.body;
    try {
      const r = userMod.login(options);
      req.session.user = r;

      // 确保session被保存
      req.session.save((err) => {
        if (err) {
          logger.error('Session保存失败, IP:', req.userIp, err);
          res.send({
            success: false,
            message: 'Session保存失败'
          });
        } else {
          logger.info('登录成功, IP:', req.userIp, 'Session ID:', req.sessionID);
          logger.debug('Session数据:', req.session);
          res.send({
            success: true
          });
        }
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
    req.session.destroy((err) => {
      if (err) {
        logger.error('Session销毁失败:', err);
      } else {
        logger.info('用户登出成功');
      }
    });
    res.send({
      success: true
    });
  };

  async get (req, res) {
    logger.debug('获取用户信息, Session ID:', req.sessionID);
    logger.debug('Session存在:', !!req.session, 'User存在:', !!req.session?.user);
    res.send({
      success: true,
      data: await userMod.get()
    });
  }
}
module.exports = User;
