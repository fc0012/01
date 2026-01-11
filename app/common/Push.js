/**
 * Push 替代类 - 空实现
 * 
 * 此类保留了原有 Push 类的接口，但所有方法都是空实现。
 * 这样可以避免其他模块调用推送功能时报错。
 * 
 * Requirements: 2.6
 */

class Push {
  constructor (push) {
    // 空实现 - 不初始化任何推送服务
  }

  _clearErrorCount () {
    // 空实现
  }

  async doRequest (type, args) {
    // 空实现 - 直接返回
    return 0;
  }

  async rssError (...args) {
    // 空实现
  }

  async scrapeError (...args) {
    // 空实现
  }

  async addTorrent (...args) {
    // 空实现
  }

  async addTorrentError (...args) {
    // 空实现
  }

  async rejectTorrent (...args) {
    // 空实现
  }

  async deleteTorrent (...args) {
    // 空实现
  }

  async deleteTorrentError (...args) {
    // 空实现
  }

  async reannounceTorrent (...args) {
    // 空实现
  }

  async reannounceTorrentError (...args) {
    // 空实现
  }

  async connectClient (...args) {
    // 空实现
    return 0;
  }

  async clientLoginError (...args) {
    // 空实现
  }

  async getMaindataError (...args) {
    // 空实现
  }

  async spaceAlarm (...args) {
    // 空实现
  }

  async plexWebhook (...args) {
    // 空实现
  }

  async embyWebhook (...args) {
    // 空实现
  }

  async jellyfinWebhook (...args) {
    // 空实现
  }

  async selectWish (...args) {
    // 空实现
  }

  async addDoubanTorrent (...args) {
    // 空实现
  }

  async addDoubanTorrentError (...args) {
    // 空实现
  }

  async torrentFinish (...args) {
    // 空实现
  }

  async selectTorrentError (...args) {
    // 空实现
  }

  async addDouban (...args) {
    // 空实现
  }

  async startRefreshWish (...args) {
    // 空实现
  }

  async startRefreshWishError (...args) {
    // 空实现
  }

  async addDoubanWish (...args) {
    // 空实现
  }

  async scrapeTorrent (...args) {
    // 空实现
  }

  async scrapeTorrentFailed (...args) {
    // 空实现
  }

  async pushTelegram (...args) {
    // 空实现
  }

  async pushNtfy (...args) {
    // 空实现
  }

  async pushWeChat (...args) {
    // 空实现
  }

  async pushWeChatSelector (...args) {
    // 空实现
  }

  async modifyWechatMenu () {
    // 空实现
  }

  async edit (...args) {
    // 空实现
  }

  async pushPlexStartOrStopToSlack (...args) {
    // 空实现
  }

  async pushEmbyStartOrStopToSlack (...args) {
    // 空实现
  }

  async pushSlack (...args) {
    // 空实现
  }

  async pushSlackRaw (...args) {
    // 空实现
  }

  async openSlackView (...args) {
    // 空实现
  }

  async push (...args) {
    // 空实现
  }

  async pushWebhook (...args) {
    // 空实现
  }
}

module.exports = Push;
