/**
 * 比较类型常量定义
 *
 * 统一管理系统中所有规则使用的比较类型
 * 用于删种规则、选种规则、RSS规则等
 *
 * @module constants/compareTypes
 */

// 使用 Object.freeze 冻结对象，防止意外修改，提升性能
export const COMPARE_TYPES = Object.freeze([
  { value: 'equal', label: '等于' },
  { value: 'greater', label: '大于' },
  { value: 'less', label: '小于' },
  { value: 'contain', label: '包含' },
  { value: 'includeIn', label: '被包含' },
  { value: 'notContain', label: '不包含' },
  { value: 'notIncludeIn', label: '不被包含' },
  { value: 'regExp', label: '正则匹配' },
  { value: 'notRegExp', label: '正则不匹配' }
]);

/**
 * 比较类型值枚举（冻结）
 */
export const COMPARE_TYPE_VALUES = Object.freeze(COMPARE_TYPES.map(type => type.value));

/**
 * 比较类型映射表（值 -> 标签）
 * 使用 Map 提升查找性能，O(1) 时间复杂度
 */
const COMPARE_TYPE_MAP = new Map();
COMPARE_TYPES.forEach(type => {
  COMPARE_TYPE_MAP.set(type.value, type.label);
});

/**
 * 根据值获取比较类型标签
 * @param {string} value - 比较类型值
 * @returns {string} 比较类型标签
 */
export function getCompareTypeLabel(value) {
  return COMPARE_TYPE_MAP.get(value) || value;
}

/**
 * 检查是否为有效的比较类型
 * @param {string} value - 比较类型值
 * @returns {boolean} 是否有效
 */
export function isValidCompareType(value) {
  return COMPARE_TYPE_MAP.has(value);
}
