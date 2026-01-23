/**
 * Error Handler Middleware
 *
 * 统一的错误处理中间件
 * 捕获并处理应用程序中的错误
 */

const logger = require('../libs/logger');

/**
 * 异步错误处理包装器
 * 自动捕获 async 函数中的错误并传递给错误处理中间件
 * @param {Function} fn - 异步函数
 * @returns {Function} 包装后的函数
 */
function asyncHandler (fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 全局错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
function errorHandler (err, req, res, next) {
  // 记录错误
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.userIp || req.ip
  });

  // 检查响应是否已经发送
  if (res.headersSent) {
    return next(err);
  }

  // 根据错误类型返回不同的状态码
  let statusCode = 500;
  let message = '服务器内部错误';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = '数据验证失败';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = '未授权访问';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = '资源未找到';
  } else if (err.message) {
    message = err.message;
  }

  // 返回错误响应
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * 404 错误处理中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function notFoundHandler (req, res) {
  res.status(404).json({
    success: false,
    message: `路径 ${req.method} ${req.path} 不存在`
  });
}

module.exports = {
  asyncHandler,
  errorHandler,
  notFoundHandler
};
