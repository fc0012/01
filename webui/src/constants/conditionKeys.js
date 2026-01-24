/**
 * 删种规则条件键常量定义
 *
 * 统一管理删种规则中可用的条件选项
 *
 * @module constants/conditionKeys
 */

// 使用 Object.freeze 冻结对象，防止意外修改，提升性能
export const DELETE_RULE_CONDITION_KEYS = Object.freeze([
  { name: '种子名称', key: 'name' },
  { name: '种子进度', key: 'progress' },
  { name: '上传速度', key: 'uploadSpeed' },
  { name: '下载速度', key: 'downloadSpeed' },
  { name: '种子分类', key: 'category' },
  { name: '种子标签', key: 'tags' },
  { name: '选择大小', key: 'size' },
  { name: '种子大小', key: 'totalSize' },
  { name: '种子状态', key: 'state' },
  { name: '站点域名', key: 'tracker' },
  { name: '返回信息', key: 'trackerStatus' },
  { name: '已完成量', key: 'completed' },
  { name: '已下载量', key: 'downloaded' },
  { name: '已上传量', key: 'uploaded' },
  { name: '分享率一', key: 'ratio' },
  { name: '分享率二', key: 'trueRatio' },
  { name: '分享率三', key: 'ratio3' },
  { name: '添加时间', key: 'addedTime' },
  { name: '完成时间', key: 'completedTime' },
  { name: '保存路径', key: 'savePath' },
  { name: '做种连接', key: 'seeder' },
  { name: '下载连接', key: 'leecher' },
  { name: '剩余空间', key: 'freeSpace' },
  { name: '下载任务', key: 'leechingCount' },
  { name: '做种任务', key: 'seedingCount' },
  { name: '全局上传', key: 'globalUploadSpeed' },
  { name: '全局下载', key: 'globalDownloadSpeed' },
  { name: '当前时间', key: 'secondFromZero' }
]);

/**
 * 条件键映射表（key -> name）
 * 使用 Map 提升查找性能，O(1) 时间复杂度
 */
const CONDITION_KEY_MAP = new Map();
DELETE_RULE_CONDITION_KEYS.forEach(key => {
  CONDITION_KEY_MAP.set(key.key, key.name);
});

/**
 * 根据键获取条件名称
 * @param {string} key - 条件键
 * @returns {string} 条件名称
 */
export function getConditionKeyName(key) {
  return CONDITION_KEY_MAP.get(key) || key;
}

/**
 * 检查是否为有效的条件键
 * @param {string} key - 条件键
 * @returns {boolean} 是否有效
 */
export function isValidConditionKey(key) {
  return CONDITION_KEY_MAP.has(key);
}
