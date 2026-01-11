/**
 * Push 替代类 - 空实现
 *
 * 此类保留了原有 Push 类的接口，但所有方法都是空实现。
 * 这样可以避免其他模块调用推送功能时报错。
 *
 * Requirements: 2.6
 */

class Push {
  _clearErrorCount () {
    // 空实现
  }

  async doRequest () {
    return 0;
  }

  async rssError () {}
  async scrapeError () {}
  async addTorrent () {}
  async addTorrentError () {}
  async rejectTorrent () {}
  async deleteTorrent () {}
  async deleteTorrentError () {}
  async reannounceTorrent () {}
  async reannounceTorrentError () {}
  async connectClient () { return 0; }
  async clientLoginError () {}
  async getMaindataError () {}
  async spaceAlarm () {}
  async plexWebhook () {}
  async embyWebhook () {}
  async jellyfinWebhook () {}
  async selectWish () {}
  async addDoubanTorrent () {}
  async addDoubanTorrentError () {}
  async torrentFinish () {}
  async selectTorrentError () {}
  async addDouban () {}
  async startRefreshWish () {}
  async startRefreshWishError () {}
  async addDoubanWish () {}
  async scrapeTorrent () {}
  async scrapeTorrentFailed () {}
  async pushTelegram () {}
  async pushNtfy () {}
  async pushWeChat () {}
  async pushWeChatSelector () {}
  async modifyWechatMenu () {}
  async edit () {}
  async pushPlexStartOrStopToSlack () {}
  async pushEmbyStartOrStopToSlack () {}
  async pushSlack () {}
  async pushSlackRaw () {}
  async openSlackView () {}
  async push () {}
  async pushWebhook () {}
}

module.exports = Push;
