/**
 * Property Test: 推送调用安全
 * 
 * **Feature: project-simplification, Property 2: 推送调用安全**
 * **Validates: Requirements 2.6**
 * 
 * *For any* 原本调用推送功能的代码路径，调用应该不会抛出异常（通过空实现或移除）
 */

const fc = require('fast-check');
const path = require('path');

// 动态加载 Push 类
let Push;
try {
  Push = require(path.join(__dirname, '../../app/common/Push'));
} catch (e) {
  console.error('无法加载 Push 模块:', e.message);
}

// Push 类的所有方法列表
const PUSH_METHODS = [
  '_clearErrorCount',
  'doRequest',
  'rssError',
  'scrapeError',
  'addTorrent',
  'addTorrentError',
  'rejectTorrent',
  'deleteTorrent',
  'deleteTorrentError',
  'reannounceTorrent',
  'reannounceTorrentError',
  'connectClient',
  'clientLoginError',
  'getMaindataError',
  'spaceAlarm',
  'plexWebhook',
  'embyWebhook',
  'jellyfinWebhook',
  'selectWish',
  'addDoubanTorrent',
  'addDoubanTorrentError',
  'torrentFinish',
  'selectTorrentError',
  'addDouban',
  'startRefreshWish',
  'startRefreshWishError',
  'addDoubanWish',
  'scrapeTorrent',
  'scrapeTorrentFailed',
  'pushTelegram',
  'pushNtfy',
  'pushWeChat',
  'pushWeChatSelector',
  'modifyWechatMenu',
  'edit',
  'pushPlexStartOrStopToSlack',
  'pushEmbyStartOrStopToSlack',
  'pushSlack',
  'pushSlackRaw',
  'openSlackView',
  'push',
  'pushWebhook'
];

// 生成随机参数
const randomParams = fc.oneof(
  fc.constant(undefined),
  fc.constant(null),
  fc.string(),
  fc.integer(),
  fc.boolean(),
  fc.object(),
  fc.array(fc.string())
);

describe('Property 2: 推送调用安全', () => {
  let pushInstance;
  
  beforeAll(() => {
    if (Push) {
      pushInstance = new Push();
    }
  });
  
  test('Push 类应该可以正常实例化', () => {
    expect(Push).toBeDefined();
    expect(() => new Push()).not.toThrow();
  });
  
  test('所有 Push 方法都应该存在', () => {
    const push = new Push();
    
    for (const method of PUSH_METHODS) {
      expect(typeof push[method]).toBe('function');
    }
  });
  
  test('调用任何 Push 方法都不应抛出异常', async () => {
    if (!pushInstance) {
      throw new Error('Push 实例未创建');
    }
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...PUSH_METHODS),
        randomParams,
        randomParams,
        randomParams,
        async (methodName, param1, param2, param3) => {
          const method = pushInstance[methodName];
          
          if (typeof method !== 'function') {
            throw new Error(`方法 ${methodName} 不存在`);
          }
          
          try {
            // 调用方法，传入随机参数
            const result = method.call(pushInstance, param1, param2, param3);
            
            // 如果返回 Promise，等待它完成
            if (result && typeof result.then === 'function') {
              await result;
            }
            
            return true;
          } catch (error) {
            throw new Error(`调用 ${methodName} 时抛出异常: ${error.message}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('同步方法调用不应抛出异常', () => {
    const push = new Push();
    
    // 测试同步方法
    expect(() => push._clearErrorCount()).not.toThrow();
  });
  
  test('异步方法调用不应抛出异常', async () => {
    const push = new Push();
    
    // 测试所有异步方法
    const asyncMethods = PUSH_METHODS.filter(m => m !== '_clearErrorCount');
    
    for (const methodName of asyncMethods) {
      const method = push[methodName];
      if (typeof method === 'function') {
        await expect(method.call(push)).resolves.not.toThrow();
      }
    }
  });
  
  test('doRequest 应返回 0', async () => {
    const push = new Push();
    const result = await push.doRequest();
    expect(result).toBe(0);
  });
  
  test('connectClient 应返回 0', async () => {
    const push = new Push();
    const result = await push.connectClient();
    expect(result).toBe(0);
  });
});
