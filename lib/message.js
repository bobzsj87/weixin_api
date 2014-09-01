/**
 * 微信消息解析以及生成
 *
 * Copyright(c) 2014 Jeremy Wei <shuimuqingshu@gmail.com>
 * MIT Licensed
 */
var parsers = [];
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
  var type = '';
  
  if (!data.MsgType) {
    callback(new Error('message type is missing'));
    return ;
  }
  
  type = data.MsgType[0].toLowerCase();
  
  if (['text', 'image', 'location', 'link', 'event'].indexOf(type) === -1) {
    callback(new Error('message type invalid'));
  } else {
    callback(null, parsers[type](data));
  }  
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

/*
 * 文本消息格式：
 * ToUserName	开发者微信号
 * FromUserName	 发送方帐号（一个OpenID）
 * CreateTime	 消息创建时间 （整型）
 * MsgType	 text
 * Content	 文本消息内容
 * MsgId	 消息id，64位整型
 */
parsers['text'] = function (data) {
  return msg = {
      "toUserName" : data.ToUserName[0],
      "fromUserName" : data.FromUserName[0],
      "createTime" : data.CreateTime[0],
      "msgType" : data.MsgType[0],
      "content" : data.Content[0],
      "msgId" : data.MsgId[0]
    };
}

/*
 * 图片消息格式：
 * ToUserName	开发者微信号
 * FromUserName	 发送方帐号（一个OpenID）
 * CreateTime	 消息创建时间 （整型）
 * MsgType	 image
 * Content	 图片链接
 * MsgId	 消息id，64位整型
 */
parsers['image'] = function (data) {
  return msg = {
		"toUserName" : data.ToUserName[0],
		"fromUserName" : data.FromUserName[0],
		"createTime" : data.CreateTime[0],
		"msgType" : data.MsgType[0],
		"picUrl" : data.PicUrl[0],
		"msgId" : data.MsgId[0]
	};
}

/*
 * 地理位置消息格式：
 * ToUserName	开发者微信号
 * FromUserName	 发送方帐号（一个OpenID）
 * CreateTime	 消息创建时间 （整型）
 * MsgType	 location
 * Location_X	 x
 * Location_Y    y
 * Scale　地图缩放大小
 * Label 位置信息
 * MsgId	 消息id，64位整型
 */
parsers['location'] = function (data) {
  return  msg = {
		"toUserName" : data.ToUserName[0],
		"fromUserName" : data.FromUserName[0],
		"createTime" : data.CreateTime[0],
		"msgType" : data.MsgType[0],
		"locationX" : data.Location_X[0],
		"locationY" : data.Location_Y[0],
		"scale" : data.Scale[0],
		"label" : data.Label[0],
		"msgId" : data.MsgId[0]
	};
}

/*
 * 链接消息格式：
 * ToUserName	开发者微信号
 * FromUserName	 发送方帐号（一个OpenID）
 * CreateTime	 消息创建时间 （整型）
 * MsgType	 link
 * Title	 消息标题
 * Description    消息描述
 * Url　消息链接
 * MsgId	 消息id，64位整型
 */
parsers['link'] = function (data) {
  return msg = {
		"toUserName" : data.ToUserName[0],
		"fromUserName" : data.FromUserName[0],
		"createTime" : data.CreateTime[0],
		"msgType" : data.MsgType[0],
		"title" : data.Title[0],
		"description" : data.Description[0],
		"url" : data.Url[0],
		"msgId" : data.MsgId[0]
	};
}

/*
 * 事件消息格式：
 * ToUserName	开发者微信号
 * FromUserName	 发送方帐号（一个OpenID）
 * CreateTime	 消息创建时间 （整型）
 * MsgType	 event
 * Event 事件类型，subscribe(订阅)、unsubscribe(取消订阅)、CLICK(自定义菜单点击事件)
 * EventKey 事件KEY值，与自定义菜单接口中KEY值对应
 */
parsers['event'] = function (data) {
	var eventKey = '';
	if (data.EventKey) {
		eventKey = data.EventKey[0];
	}
	
	return msg = {
		"toUserName" : data.ToUserName[0],
		"fromUserName" : data.FromUserName[0],
		"createTime" : data.CreateTime[0],
		"msgType" : data.MsgType[0],
		"event" : data.Event[0],
		"eventKey" : eventKey
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
