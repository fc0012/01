const crypto = require('crypto');
const util = require('../libs/util');
const logger = require('../libs/logger');
const parser = require('xml2js').parseString;

const parseXml = util.promisify(parser);

const PKCS7Encoder = {};

PKCS7Encoder.decode = function (text) {
  let pad = text[text.length - 1];
  if (pad < 1 || pad > 32) {
    pad = 0;
  }
  return text.slice(0, text.length - pad);
};

PKCS7Encoder.encode = function (text) {
  const blockSize = 32;
  const textLength = text.length;
  const amountToPad = blockSize - (textLength % blockSize);
  const result = Buffer.from(amountToPad);
  result.fill(amountToPad);
  return Buffer.concat([text, result]);
};

class WebhookMod {
  async handleSlackShortCuts (id, event) {
    // Douban features disabled
    return '';
  }

  async handelSlackBlockActions (event) {
    // Douban features disabled
    return '';
  }

  async plex (req) {
    if (!req.body) {
      return '服务正常';
    }
    const payload = JSON.parse(req.body.payload);
    if (global.webhookPush.type === 'slack') {
      if (['media.play', 'media.stop', 'media.resume', 'media.pause', 'media-scrobble', 'library.new'].indexOf(payload.event) !== -1) {
        await global.webhookPush.pushPlexStartOrStopToSlack(payload);
      }
      return '';
    }
    const eventMap = {
      'library-new': '媒体已添加',
      'media-play': '播放已开始',
      'media-pause': '播放已暂停',
      'media-resume': '播放已恢复',
      'media-stop': '播放已停止',
      'media-scrobble': '播放超过 90%'
    };
    const event = eventMap[payload.event.replace('.', '-')] + ': ' + payload.Metadata.title + ' / ' + (payload.Metadata.originalTitle || '');
    const note = `用户: ${payload.Account.title}\n` +
      `媒体: ${payload.Metadata.title} / ${payload.Metadata.originalTitle || ''}\n` +
      `服务器: ${payload.Server.title}\n` +
      `媒体库: ${payload.Metadata.librarySectionTitle}\n`;
    if (global.webhookPush) {
      await global.webhookPush.plexWebhook(event, note);
    }
    return '';
  }

  async emby (req) {
    if (!req.body) {
      return '服务正常';
    }
    const payload = JSON.parse(req.body.data);
    if (global.webhookPush.type === 'slack') {
      if (['media.play', 'media.stop', 'media.resume', 'media.pause', 'media-scrobble', 'media.new'].indexOf(payload.event) !== -1) {
        await global.webhookPush.pushEmbyStartOrStopToSlack(payload);
      }
      return;
    }
    const eventMap = {
      newItemAdded: '媒体已添加',
      playbackStart: '播放已开始',
      playbackStop: '播放已停止'
    };
    const event = eventMap[payload.event] + ': ' + payload.itemName + ' / ' + (payload.originalName || '');
    const note = `用户: ${payload.userName}\n` +
      `媒体: ${payload.itemName} / ${payload.originalName || ''}\n` +
      `服务器: ${payload.serverName}\n` +
      `媒体库: ${payload.libraryName}\n`;
    if (global.webhookPush) {
      await global.webhookPush.embyWebhook(event, note);
    }
    return '';
  }

  async jellyfin (req) {
    const payload = req.body;
    if (!req.body || !req.query.timestamp || !req.query.nonce) {
      return '服务正常';
    }
    const eventMap = {
      ItemAdded: '媒体已添加',
      PlaybackStart: '播放已开始',
      PlaybackStop: '播放已停止'
    };
    const event = eventMap[payload.NotificationType] + ': ' + payload.Name + ' / ' + (payload.SeriesName || '');
    const note = `用户: ${payload.NotificationUsername}\n` +
      `媒体: ${payload.Name} / ${payload.SeriesName || ''}\n` +
      `服务器: ${payload.ServerName}\n`;
    if (global.webhookPush) {
      await global.webhookPush.jellyfinWebhook(event, note);
    }
    return '';
  }

  async wechat (req) {
    let body;
    const query = req.query;
    if (!req.body || !req.query.timestamp || !req.query.nonce) {
      return '服务正常';
    }
    if (!query.echostr) {
      try {
        body = await parseXml(await req.body);
      } catch (e) {
        logger.error(e);
        return '请求格式错误!!';
      }
    }
    const aesKey = Buffer.from(global.wechatAesKey, 'base64').toString('hex');
    const token = global.wechatToken;
    const encryptStr = query.echostr || body.xml.Encrypt[0];
    const encodingStr = [token, query.timestamp, query.nonce, encryptStr].sort().join('');
    const sign = crypto.createHash('sha1').update(encodingStr).digest('hex').toLowerCase();
    if (sign !== query.msg_signature) return '签名错误!!';
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(aesKey, 'hex'), Buffer.from(aesKey.substring(32), 'hex'));
    decipher.setAutoPadding(false);
    let decodeBuffer = Buffer.concat([decipher.update(Buffer.from(encryptStr, 'base64')), (decipher.final())]);
    decodeBuffer = PKCS7Encoder.decode(decodeBuffer);
    let content = decodeBuffer.slice(16);
    const length = content.slice(0, 4).readUInt32BE(0);
    content = content.slice(4, length + 4).toString();
    if (query.echostr) return content;
    content = await parseXml(content);
    logger.debug(content);
    // Douban features disabled
    return content;
  }

  async slack (body) {
    // if ()
    if (body.challenge) {
      return {
        challenge: body.challenge
      };
    }
    if (body.payload) {
      body.event = JSON.parse(body.payload);
    }
    if (!body.event ||
      body.event.subtype === 'bot_message' ||
      body.event.subtype === 'message_deleted') {
      return '';
    }
    const event = body.event;
    // logger.info(event);
    if (event.callback_id) {
      return await this.handleSlackShortCuts(event.callback_id, event);
    }
    if (event.type === 'block_actions') {
      return await this.handelSlackBlockActions(event);
    }
    if (event.type === 'view_submission') {
      return await this.handleViewSubmission(event);
    }
    return event;
  }
}
module.exports = WebhookMod;
