/**
 * HTTP数据统一解析接口
 *
 * Copyright(c) 2014 Jeremy Wei <shuimuqingshu@gmail.com>
 * MIT Licensed
 */
var xml2js = require('xml2js');

var Http = module.exports = function (req, res) {
  this.req = req;
  this.res = res;
  this.params = {};
  
  var query = req.query || require('url').parse(req.url, true).query;;

  for (variable in query) {
      this.params[variable] = query[variable];
  }
  // console.log(this.params);
}

/**
 * 内容输入
 * 
 * http.in(function (data) {
 *  // do something with data
 * });
 *
 * @param {Function} callback 
 * @api public 
 */
Http.prototype.in = function (callback) {
  // 获取XML内容
  var buf = '';
  this.req.setEncoding('utf8');
  this.req.on('data', function(chunk) {
    buf += chunk;
  });

  // 内容接收完毕
  this.req.on('end', function() {
    xml2js.parseString(buf, function(err, json) {
      if (err) {
        throw err;
      } else {
        callback(json.xml);
      }
    });
  });
}

/**
 * 内容输出
 * 
 * http.out(data)
 *
 * @param {Int} code 
 * @param {String} data 
 * @api public 
 */
Http.prototype.out = function (code, data) {
  if (this.res) {
    // Express
    if (this.req.query) {
      this.res.status(code).send(data);
      
    // Node
    } else {
      this.res.statusCode = code;
      this.res.end(data);
    }
  }
}