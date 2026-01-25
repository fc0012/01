import axios from 'axios';
import { message } from 'ant-design-vue';

// 创建 axios 实例
const instance = axios.create({
  timeout: 10000,
  validateStatus: () => true
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 可以在这里添加 token 或其他请求头
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理 401 错误
    if (error.response && error.response.status === 401) {
      message.error('鉴权失效，请重新登录');
      // 可以在这里跳转到登录页
      // window.location.href = '/user/login';
    }
    return Promise.reject(error);
  }
);

const get = async (url) => {
  try {
    const res = await instance.get(url);
    if (!res.data.success) {
      throw new Error(res.data.message);
    }
    return res.data;
  } catch (error) {
    throw new Error(error.message || '请求失败');
  }
};

const post = async (url, json) => {
  try {
    const res = await instance.post(url, json);
    if (!res.data.success) {
      throw new Error(res.data.message);
    }
    return res.data;
  } catch (error) {
    throw new Error(error.message || '请求失败');
  }
};

export {
  get,
  post
};
