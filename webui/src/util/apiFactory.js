/**
 * API Factory
 *
 * 创建标准 CRUD API 函数的工厂函数
 * 用于减少 API 模块中的重复代码
 */

import { get, post } from './axios';

/**
 * 创建标准 CRUD API 对象
 * @param {string} apiPrefix - API 路径前缀，例如 '/api/deleteRule'
 * @returns {Object} 包含 list, add, modify, delete 方法的 API 对象
 */
export function createCrudApi (apiPrefix) {
  return {
    list: async () => {
      const url = `${apiPrefix}/list`;
      return await get(url);
    },
    modify: async (item) => {
      const url = `${apiPrefix}/${item.id ? 'modify' : 'add'}`;
      return await post(url, item);
    },
    delete: async (id) => {
      const url = `${apiPrefix}/delete`;
      return await post(url, { id });
    }
  };
}

/**
 * 创建带自定义操作的 API 对象
 * @param {string} apiPrefix - API 路径前缀
 * @param {Object} customMethods - 自定义方法对象
 * @returns {Object} 包含标准 CRUD 和自定义方法的 API 对象
 */
export function createApi (apiPrefix, customMethods = {}) {
  const standardMethods = createCrudApi(apiPrefix);
  return {
    ...standardMethods,
    ...customMethods
  };
}
