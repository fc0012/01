import user from './user';
import server from './server';
import site from './site';
import setting from './setting';
import downloader from './downloader';
import deleteRule from './deleteRule';
import rssRule from './rssRule';
import selectRule from './selectRule';
import rss from './rss';
import torrent from './torrent';
import log from './log';

const api = {
  user,
  setting,
  downloader,
  server,
  site,
  deleteRule,
  rssRule,
  selectRule,
  rss,
  torrent,
  log
};

export default () => { return api; };
