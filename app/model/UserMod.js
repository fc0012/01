const otp = require('../libs/otp');

class UserMod {
  login (options) {
    if (options.username !== global.auth.username) {
      throw new Error('用户名错误');
    }
    if (options.password !== global.auth.password) {
      throw new Error('密码错误');
    }
    if (global.auth.otp && !otp.verify(global.auth.otp, options.otpPw)) {
      throw new Error('两步验证错误');
    }
    return options.username;
  };

  get (options) {
    const menu = [
      {
        title: '首页',
        path: '/index',
        icon: ['fas', 'house-user']
      }, {
        title: '数据监控',
        path: '/metric',
        icon: ['fas', 'chart-line'],
        sub: [{
          title: '下载器',
          path: '/metric/downloader',
          icon: ['fas', 'download']
        }]
      }, {
        title: '基础组件',
        path: '/base',
        icon: ['fas', 'circle-nodes'],
        sub: [{
          title: '下载器',
          path: '/base/downloader',
          icon: ['fas', 'download']
        }]
      }, {
        title: '规则组件',
        path: '/rule',
        icon: ['fas', 'code'],
        sub: [{
          title: '删种规则',
          path: '/rule/delete',
          icon: ['fas', 'ban']
        }, {
          title: 'RSS 规则',
          path: '/rule/rss',
          icon: ['fas', 'square-rss']
        }]
      }, {
        title: '任务配置',
        path: '/task',
        icon: ['fas', 'list-check'],
        sub: [{
          title: 'RSS 任务',
          path: '/task/rss',
          icon: ['fas', 'rss']
        }]
      }, {
        title: '任务历史',
        path: '/history',
        icon: ['fas', 'clock-rotate-left'],
        sub: [{
          title: 'RSS 历史',
          path: '/history/rss',
          icon: ['fas', 'rss']
        }]
      }, {
        title: '常用工具',
        path: '/tool',
        icon: ['fas', 'toolbox'],
        sub: [{
          title: '清除历史记录',
          path: '/tool/clearHistory',
          icon: ['fas', 'trash']
        }, {
          title: '下载器日志',
          path: '/tool/clientLog',
          icon: ['fas', 'note-sticky']
        }]
      }, {
        title: '系统设置',
        path: '/setting',
        icon: ['fas', 'gears'],
        sub: [{
          title: '基础设置',
          path: '/setting/base',
          icon: ['fas', 'gears']
        }, {
          title: '主题设置',
          path: '/setting/style',
          icon: ['fas', 'wand-magic-sparkles']
        }, {
          title: '安全设置',
          path: '/setting/security',
          icon: ['fas', 'fingerprint']
        }, {
          title: '交互设置',
          path: '/setting/interaction',
          icon: ['fas', 'fire']
        }, {
          title: '菜单设置',
          path: '/setting/menu',
          icon: ['fas', 'bars']
        }, {
          title: 'CookieCloud',
          path: '/setting/cc',
          icon: ['fas', 'cookie']
        }, {
          title: '备份还原',
          path: '/setting/backup',
          icon: ['fas', 'floppy-disk']
        }]
      }, {
        title: '系统信息',
        path: '/info',
        icon: ['fas', 'circle-info'],
        sub: [{
          title: '系统信息',
          path: '/info/info',
          icon: ['fas', 'circle-info']
        }, {
          title: '系统日志',
          path: '/info/log',
          icon: ['fas', 'note-sticky']
        }, {
          title: '关于',
          path: '/info/about',
          icon: ['fas', 'circle-question']
        }]
      }
    ];
    for (const m of menu) {
      if (global.menu[0] && global.menu.indexOf(m.path) !== -1) {
        m.hidden = true;
      }
      if (m.sub) {
        for (const mm of m.sub) {
          if (global.menu[0] && global.menu.indexOf(mm.path) !== -1) {
            mm.hidden = true;
          }
        }
      }
    }
    return { menu };
  };
}

module.exports = UserMod;
