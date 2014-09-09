/**
 * 微信消息解析以及生成
 *
 * Copyright(c) 2014 Jeremy Wei <shuimuqingshu@gmail.com>
 * MIT Licensed
 */
var creaters = [];

var Message = function () {
  
};

module.exports = new Message();

/**
 * 解析请求消息数据
 * 
 * message.requestMessage(data, function (err, msg) {
 *  if (err) throw err;
 *  // do something with msg
 * });
 *
 * @param {Object} data 
 * @param {Function} callback 
 * @api public 
 */
Message.prototype.requestMessage = function (data, callback) {
  var msg = {};
  for (var property in data) {
      if (data.hasOwnProperty(property)) {
          msg[property[0].toLowerCase()+property.slice(1)] = data[property][0];
      }
  }
    callback(null, msg);
}

/**
 * 生成响应消息
 * 
 * message.responseMessage(data, function (err, msg) {
 *  if (err) throw err;
 *  // do something with msg
 * });
 *
 * @param {Object} data 
 * @param {Function} callback 
 * @api public 
 */
Message.prototype.responseMessage = function (data, callback) {
  
  if(typeof data === "string"){
    callback(null, data);
    return;
  }

  if (!data.msgType) {
    callback(new Error('create message type is missing'));
    return ;
  }
  
  var type = data.msgType.toLowerCase();
  if (['text', 'music', 'news'].indexOf(type) === -1) {
    callback(new Error('create message type invalid'));
  } else {
    callback(null, creaters[type](data));
  }  
}


creaters['text'] = function (msg) {
  return output = "" + 
  "<xml>" + 
     "<ToUserName><![CDATA[" + msg.toUserName + "]]></ToUserName>" + 
     "<FromUserName><![CDATA[" + msg.fromUserName + "]]></FromUserName>" + 
     "<CreateTime>" + new Date().getTimestamp() + "</CreateTime>" + 
     "<MsgType><![CDATA[" + msg.msgType + "]]></MsgType>" + 
     "<Content><![CDATA[" + msg.content + "]]></Content>" + 
  "</xml>";
}

creaters['music'] = function (msg) {
  return output = "" + 
  "<xml>" + 
     "<ToUserName><![CDATA[" + msg.toUserName + "]]></ToUserName>" + 
     "<FromUserName><![CDATA[" + msg.fromUserName + "]]></FromUserName>" + 
     "<CreateTime>" + new Date().getTimestamp() + "</CreateTime>" + 
     "<MsgType><![CDATA[" + msg.msgType + "]]></MsgType>" + 
      "<Music>" + 
      "<Title><![CDATA[" + msg.title + "]]></Title>" + 
      "<Description><![CDATA[" + msg.description + "DESCRIPTION]]></Description>" + 
      "<MusicUrl><![CDATA[" + msg.musicUrl + "]]></MusicUrl>" + 
      "<HQMusicUrl><![CDATA[" + msg.HQMusicUrl + "]]></HQMusicUrl>" + 
      "</Music>" + 
  "</xml>";
}

creaters['news'] = function (msg) {
  var articlesStr = "";  
  for (var i = 0; i < msg.articles.length; i++) 
  {
    articlesStr += "<item>" + 
              "<Title><![CDATA[" + msg.articles[i].title + "]]></Title>" + 
              "<Description><![CDATA[" + msg.articles[i].description + "]]></Description>" + 
              "<PicUrl><![CDATA[" + msg.articles[i].picUrl + "]]></PicUrl>" + 
              "<Url><![CDATA[" + msg.articles[i].url + "]]></Url>" + 
              "</item>";
  }
  
  return output = "" + 
  "<xml>" + 
     "<ToUserName><![CDATA[" + msg.toUserName + "]]></ToUserName>" + 
     "<FromUserName><![CDATA[" + msg.fromUserName + "]]></FromUserName>" + 
     "<CreateTime>" + new Date().getTimestamp() + "</CreateTime>" + 
     "<MsgType><![CDATA[" + msg.msgType + "]]></MsgType>" + 
     "<ArticleCount>" + msg.articles.length + "</ArticleCount>" +
      "<Articles>" + articlesStr + "</Articles>" +
  "</xml>";
}

Date.prototype.getTimestamp = function () {
  return Math.round(this.getTime() / 1000);
}
