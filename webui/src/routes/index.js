import { createRouter, createWebHistory } from 'vue-router';

import Index from '@/pages/Index';

import Layout from '@/pages/Layout';

import DashboardIndex from '@/pages/dashboard/Index';

import BaseDownloader from '@/pages/base/Downloader';

import MetricDownloader from '@/pages/metric/Downloader';

import RuleDelete from '@/pages/rule/Delete';
import RuleRss from '@/pages/rule/Rss';
import RuleSelect from '@/pages/rule/Select';

import TaskRss from '@/pages/task/Rss';

import ToolMTeamLogin from '@/pages/tool/MTeamLogin';
import ToolShell from '@/pages/tool/Shell';
import ToolClientLog from '@/pages/tool/ClientLog';
import ToolClearHistory from '@/pages/tool/ClearHistory';

import InfoInfo from '@/pages/info/Info';
import InfoLog from '@/pages/info/Log';
import InfoAbout from '@/pages/info/About';

import SettingBase from '@/pages/setting/Base';
import SettingStyle from '@/pages/setting/Style';
import SettingSecurity from '@/pages/setting/Security';
import SettingInteraction from '@/pages/setting/Interaction';
import SettingMenu from '@/pages/setting/Menu';
import SettingBackup from '@/pages/setting/Backup';
import SettingCookieCloud from '@/pages/setting/CookieCloud';

import HistoryRss from '@/pages/history/Rss';

import Login from '@/pages/user/Login';

const user = {
  path: 'user',
  component: Index,
  children: [
    {
      path: 'login',
      component: Login,
      meta: {
        title: '用户登录'
      }
    }
  ]
};

const index = {
  path: 'index',
  component: Layout,
  redirect: '/index',
  children: [
    {
      path: '',
      component: DashboardIndex,
      meta: {
        title: '首页'
      }
    }
  ]
};

const metric = {
  path: 'metric',
  component: Layout,
  redirect: '/metric/downloader',
  children: [
    {
      path: 'downloader',
      component: MetricDownloader,
      meta: {
        title: '下载器 - 数据监控'
      }
    }
  ]
};

const rule = {
  path: 'rule',
  component: Layout,
  redirect: '/rule/delete',
  children: [
    {
      path: 'delete',
      component: RuleDelete,
      meta: {
        title: '删种规则 - 规则组件'
      }
    }, {
      path: 'rss',
      component: RuleRss,
      meta: {
        title: 'RSS 规则 - 规则组件'
      }
    }, {
      path: 'select',
      component: RuleSelect,
      meta: {
        title: '选种规则 - 规则组件'
      }
    }
  ]
};

const base = {
  path: 'base',
  component: Layout,
  redirect: '/base/downloader',
  children: [
    {
      path: 'downloader',
      component: BaseDownloader,
      meta: {
        title: '下载器 - 基础组件'
      }
    }
  ]
};

const info = {
  path: 'info',
  component: Layout,
  redirect: '/info/about',
  children: [
    {
      path: 'info',
      component: InfoInfo,
      meta: {
        title: '系统信息 - 系统信息'
      }
    }, {
      path: 'log',
      component: InfoLog,
      meta: {
        title: '系统日志 - 系统信息'
      }
    }, {
      path: 'about',
      component: InfoAbout,
      meta: {
        title: '关于 - 系统信息'
      }
    }
  ]
};

const setting = {
  path: 'setting',
  component: Layout,
  redirect: '/setting/base',
  children: [
    {
      path: 'base',
      component: SettingBase,
      meta: {
        title: '基础设置 - 系统设置'
      }
    }, {
      path: 'style',
      component: SettingStyle,
      meta: {
        title: '主题设置 - 系统设置'
      }
    }, {
      path: 'security',
      component: SettingSecurity,
      meta: {
        title: '安全设置 - 系统设置'
      }
    }, {
      path: 'interaction',
      component: SettingInteraction,
      meta: {
        title: '交互设置 - 系统设置'
      }
    }, {
      path: 'menu',
      component: SettingMenu,
      meta: {
        title: '菜单设置 - 系统设置'
      }
    }, {
      path: 'cc',
      component: SettingCookieCloud,
      meta: {
        title: 'CookieCloud - 系统设置'
      }
    }, {
      path: 'backup',
      component: SettingBackup,
      meta: {
        title: '备份还原 - 系统设置'
      }
    }
  ]
};

const task = {
  path: 'task',
  component: Layout,
  redirect: '/task/rss',
  children: [
    {
      path: 'rss',
      component: TaskRss,
      meta: {
        title: 'Rss 任务 - 任务配置'
      }
    }
  ]
};

const history = {
  path: 'history',
  component: Layout,
  redirect: '/history/rss',
  children: [
    {
      path: 'rss',
      component: HistoryRss,
      meta: {
        title: 'RSS 历史 - 任务历史'
      }
    }
  ]
};

const tool = {
  path: 'tool',
  component: Layout,
  redirect: '/tool/clearHistory',
  children: [
    {
      path: 'mteamLogin',
      component: ToolMTeamLogin,
      meta: {
        title: 'MTEAM 登录 - 常用工具'
      }
    }, {
      path: 'clearHistory',
      component: ToolClearHistory,
      meta: {
        title: '清除历史记录 - 常用工具'
      }
    }, {
      path: 'shell/:id',
      component: ToolShell,
      meta: {
        title: 'Shell - 常用工具'
      }
    }, {
      path: 'clientLog',
      component: ToolClientLog,
      meta: {
        title: '下载器日志 - 常用工具'
      }
    }
  ]
};

const routes = [{
  path: '/',
  component: Index,
  redirect: '/index',
  children: [
    user,
    index,
    metric,
    rule,
    base,
    task,
    tool,
    info,
    setting,
    history
  ]
}];

export default createRouter({
  history: createWebHistory(),
  routes
});
