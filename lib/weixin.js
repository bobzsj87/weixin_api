/**
 * Weixin api 
 * Copyright(c) 2014 Jeremy Wei <shuimuqingshu@gmail.com>
 * MIT Licensed
 */
var sha1 = require('sha1');
var events = require('events');
var emitter = new events.EventEmitter();
var message = require('./message');
var HTTP = require('./http');
var request = require('request');
var spawn = require('child_process').spawn;

var http = null;
var Weixin = function() {
  this.token = '';
}

module.exports = new Weixin();

/**
 * 签名校验方法
 * 
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @api public
 */
Weixin.prototype.signature = function(req, res) {
  var http = new HTTP(req, res);
  
  // 按照字典排序
  var array = [this.token, http.params.timestamp, http.params.nonce];
  array.sort();
  
  // 连接
  var str = sha1(array.join(""));
  
  // 对比签名
  if(str == http.params.signature) {
    http.out(200, http.params.echostr);
  } else {
    http.out(500, 'sign fail');
  }
}


/**
 * 开始监听微信消息
 * 
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @api public
 */
Weixin.prototype.listen = function(req, res) {
  http = new HTTP(req, res);
  http.in(function (data) {
    message.requestMessage(data, function (err, msg) {
      var eventName = msg.msgType + 'MessageComing';
      emitter.emit(eventName, msg);
    });
  });
}

/**
 * 发送信息
 * 
 * @param {Object} msg 消息对象
 * @api public
 */
Weixin.prototype.sendMsg = function(data) {
  message.responseMessage(data, function (err, msg) {
    http.out(200, msg);
  });
}

/**
 * 监听消息
 * 
 * weixin.message('text', function(msg, err){
 *  if (err) throw err;
 *  // do with msg
 * });
 *
 * @param {String} type 
 * @param {Function} callback 
 * @api public
 */
Weixin.prototype.message = function(type, callback) {
  var eventName = '';
  
  if (!type) {
    callback(new Error('listen message type is missing'));
    return this;
  }
  
  type = type.toLowerCase();
  
  if (['text', 'image', 'location', 'link', 'event'].indexOf(type) === -1) {
    callback(new Error('listen message type invalid'));
  } else {
    eventName = type + 'MessageComing';
    emitter.on(eventName, callback);
  }
    
  return this;
}


/**
 * Init and menu
 */

// 每一个小时更新access token一次（两个小时后会过期）
// 也会创造自定义菜单
Weixin.prototype.initialize = function(APP_ID, APP_SECRET, menuJSON) {

  var self = this;

  function getToken() {
    var accessTokenURL = "https://api.wechat.com/cgi-bin/token?grant_type=client_credential&appid="+APP_ID+"&secret="+APP_SECRET;
    var accessTokenOptions = {
      method: "GET",
      encoding: "utf-8",
      url: accessTokenURL
    };

    function accessTokenCallback (error, response, body) {
      if (!error && response.statusCode == 200) {
        var data = JSON.parse(body);
        self.ACCESS_TOKEN = data.access_token;
        console.log("New access token retrieved: " + self.ACCESS_TOKEN);

        // now update the menu
        if (menuJSON){
          if (self.httpPrefix){
            for (var b in menuJSON.button){
              if (menuJSON.button[b].type == "view" && menuJSON.button[b].url.indexOf("http://") != 0){
                menuJSON.button[b].url = self.httpPrefix + menuJSON.button[b].url;
              }
            }
          }
          //console.log(menuJSON);

          var postMenuURL = "https://api.weixin.qq.com/cgi-bin/menu/create?access_token=" + self.ACCESS_TOKEN;
          var postMenuOptions = {
            method: "POST",
            url: postMenuURL,
            body: JSON.stringify(menuJSON)
          };

          function postMenuCallback(err, res, body) {
            console.log("menu response " + body);
          }

          request(postMenuOptions, postMenuCallback);
        }


      } 
      else {
        console.log("error occured:" + body + "error: " + error);
        setTimeout(function() {
          request(accessTokenOptions, accessTokenCallback);
        }, 5000);
      }
    }
    request(accessTokenOptions, accessTokenCallback);
  }

  setInterval(getToken, 3600000) && getToken();
}


// 获取多媒体文件的url
Weixin.prototype.getMediaURL = function(media_id) {
  return "http://file.api.weixin.qq.com/cgi-bin/media/get?access_token="+this.ACCESS_TOKEN+"&media_id="+media_id;
}



// ------------------- 发送客服消息 -----------------------

Weixin.prototype.handlePushCallback = function(body, callback){
  var pushURL = "https://api.wechat.com/cgi-bin/message/custom/send?access_token=" + this.ACCESS_TOKEN;
  var pushOptions = {
      method: "POST",
      url: pushURL,
      body: JSON.stringify(body)
    };
  request(pushOptions, function(error, response, body){
    if (!error && response.statusCode == 200 && callback) {
      bodyObject = JSON.parse(body);
      callback(bodyObject.errmsg === "ok" ? null : new Error("Error delivering: " + body));
    }
  });
}


// 发送文本消息

Weixin.prototype.pushTextMsg = function(wechatId, message, callback) {

  this.handlePushCallback({
        "touser" : wechatId,
        "msgtype" : "text",
        "text" :
        {
          "content" : message
        }
      }, callback);
}

// 发送语音消息
Weixin.prototype.pushVoiceMsg = function(wechatId, mediaId, callback) {

  this.handlePushCallback({
      "touser" : wechatId,
      "msgtype" : "voice",
      "voice" : 
      {
        "media_id" : mediaId
      }
    }, callback);
}

// 发送图片消息
Weixin.prototype.pushImageMsg = function(wechatId, mediaId, callback) {

  this.handlePushCallback({
      "touser" : wechatId,
      "msgtype" : "image",
      "image" : 
      {
        "media_id" : mediaId
      }
    }, callback);
}


Weixin.prototype.pushNewsMsg = function(wechatId, articles, callback) {
  // articles: title, description, url, picurl
  this.handlePushCallback({
      "touser" : wechatId,
      "msgtype" : "news",
      "news":{
        "articles": articles
      }
    }, callback);
}

Weixin.prototype.uploadMedia = function(type, filePath, callback){
  var self = this;
  var toURL = "http://file.api.weixin.qq.com/cgi-bin/media/upload?access_token=" + self.ACCESS_TOKEN + "&type=" + type;
  var params = [
        '-F', 'media=@'+filePath,
        toURL
      ];
  var ret = "";
  var curl = spawn('curl', params);
  curl.on('close', function(code) {
      if (code === 0) {
        var json = JSON.parse(ret);
        if (json.errcode){
          callback(new Error(ret));
        }
        callback(null, json.media_id);
      } 
      else {
        callback(new Error('push Media error'));
      }
  });
  curl.stdout.on('data', function (data) {
    ret += data;
  });
}
