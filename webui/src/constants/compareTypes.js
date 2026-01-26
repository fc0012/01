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
  { value: 'equal', label: '等于', aliases: ['equals'] },
  { value: 'greater', label: '大于', aliases: ['bigger'] },
  { value: 'less', label: '小于', aliases: ['smaller'] },
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
  // 添加别名映射
  if (type.aliases) {
    type.aliases.forEach(alias => {
      COMPARE_TYPE_MAP.set(alias, type.label);
    });
  }
});

/**
 * 根据值获取比较类型标签
 * @param {string} value - 比较类型值
 * @returns {string} 比较类型标签
 */
export function getCompareTypeLabel (value) {
  return COMPARE_TYPE_MAP.get(value) || value;
}

/**
 * 检查是否为有效的比较类型
 * @param {string} value - 比较类型值
 * @returns {boolean} 是否有效
 */
export function isValidCompareType (value) {
  // 检查是否为标准值或别名
  return COMPARE_TYPE_MAP.has(value);
}

/**
 * 将别名转换为标准值
 * @param {string} value - 比较类型值（可能是别名）
 * @returns {string} 标准值
 */
export function normalizeCompareType (value) {
  // 如果是标准值，直接返回
  const standardType = COMPARE_TYPES.find(type => type.value === value);
  if (standardType) {
    return value;
  }

  // 如果是别名，返回对应的标准值
  for (const type of COMPARE_TYPES) {
    if (type.aliases && type.aliases.includes(value)) {
      return type.value;
    }
  }

  // 如果都不是，返回原值
  return value;
}
