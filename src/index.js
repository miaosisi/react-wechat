"use strict";

var Wechat = {};

console.log('test');

Wechat.actions = require("./actions.js");
Wechat.stores = require("./stores.js");
Wechat.handler = require("./handler.js");

module.exports = Wechat;
