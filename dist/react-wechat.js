(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.reactWechat = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
    (function (global){
    'use strict';
    
    var reflux = (typeof window !== "undefined" ? window['reflux'] : typeof global !== "undefined" ? global['reflux'] : null);
    var $ = (typeof window !== "undefined" ? window['jquery'] : typeof global !== "undefined" ? global['jquery'] : null);
    
    var Actions = reflux.createActions({
        requestOpenIdByCode: { asyncResult: true },
        requestJSSDKConfig: { asyncResult: true },
        getUserInfo: { asyncResult: true },
        loadWechatLib: { asyncResult: true },
        initJSSDKSettings: { asyncResult: true },
        getWXLocation: { asyncResult: true },
        getSubscribedUserInfo: { asyncResult: true },
        setShareContent: { children: ['shareCompleted', 'shareCanceled'] }
    });
    
    var getCurrentUrl = function getCurrentUrl() {
        return window.location.href.replace(/#.*$/, '');
    };
    
    var getBaseUrl = function getBaseUrl() {
        return getCurrentUrl().replace(/\/[^\/]*$/, '/');
    };
    
    var getExternalUrl = function getExternalUrl(url) {
        return (/^(http:|https:)/.test(url) ? url : getBaseUrl() + url
        );
    };
    
    Actions.requestOpenIdByCode.listen(function (apiUrl, code) {
        $.ajax({
            url: apiUrl,
            type: 'post',
            data: {
                code: code
            },
            dataType: 'json',
            success: this.completed,
            error: this.failed
        });
    });
    
    Actions.getUserInfo.listen(function (apiUrl, openid, token) {
        var self = this;
        $.ajax({
            url: apiUrl,
            type: 'post',
            data: {
                openid: openid,
                access_token: token
            },
            dataType: 'json',
            success: this.completed,
            error: function error(xhr) {
                alert(xhr.responseText);
                self.failed();
            }
        });
    });
    
    Actions.getSubscribedUserInfo.listen(function (apiUrl, openid) {
        var self = this;
        $.ajax({
            url: apiUrl,
            type: 'post',
            data: {
                openid: openid
            },
            dataType: 'json',
            success: this.completed,
            error: function error(xhr) {
                alert(xhr.responseText);
                self.failed();
            }
        });
    });
    
    var jsApiList = {};
    var config = {};
    var wx = {};
    var debug = false;
    
    Actions.requestJSSDKConfig.listen(function (apiUrl, location, _jsApiList, _debug) {
        jsApiList = _jsApiList;
        debug = _debug || false;
    
        if (!location) {
            location = getCurrentUrl();
        }
    
        $.ajax({
            url: apiUrl,
            type: 'get',
            data: {
                url: location
            },
            dataType: 'json',
            success: this.completed,
            error: this.failed
        });
    });
    
    Actions.loadWechatLib.listen(function () {
        // load wechat js
        var script = document.createElement('script');
        script.async = 'async';
        script.src = 'http://res.wx.qq.com/open/js/jweixin-1.0.0.js';
        script.onload = this.completed;
        document.getElementsByTagName('head')[0].appendChild(script);
    });
    
    // 获取设置后，立即载入lib
    Actions.requestJSSDKConfig.completed.listen(function (_config) {
        config = _config;
        Actions.loadWechatLib();
    });
    
    // 载入lib后，立即初始化JSSDK
    Actions.loadWechatLib.completed.listen(function () {
        Actions.initJSSDKSettings(jsApiList, config);
    });
    
    var isJssdkReady = false;
    
    Actions.initJSSDKSettings.listen(function (jsAPIList, _config) {
        var configData = {
            jsApiList: jsApiList,
            debug: debug || false,
            appId: _config.appid,
            timestamp: _config.timestamp,
            nonceStr: _config.noncestr,
            signature: _config.signature
        };
        wx = window.wx;
        var self = this;
    
        if (wx) {
            wx.config(configData);
            wx.ready(function () {
                isJssdkReady = true;
                self.completed();
            });
            wx.error(function (res) {
                console.error(res);
                self.failed(res);
            });
        } else {
            self.failed('no wx');
        }
    });
    
    Actions.getWXLocation.listen(function () {
        if (wx) {
            wx.getLocation({
                success: this.completed
            });
        } else {
            this.failed('no wx');
        }
    });
    
    var cachedOption = null;
    
    Actions.setShareContent.listen(function (options, appid, scope) {
        options.link = getExternalUrl(options.link);
        scope = scope || 'snsapi_base';
        if (appid) {
            options.link = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + appid + '&redirect_uri=' + encodeURIComponent(options.link) + '&response_type=code&scope=' + scope + '&state=STATE#wechat_redirect';
        }
    
        options.imgUrl = getExternalUrl(options.imgUrl);
        options.success = this.shareCompleted;
        options.cancel = this.shareCanceled;
    
        if (isJssdkReady && wx) {
            wx.onMenuShareAppMessage(options);
            if (options.timelineTitle) {
                options.title = options.timelineTitle;
            }
            wx.onMenuShareTimeline(options);
        } else {
            cachedOption = options;
        }
    });
    
    Actions.initJSSDKSettings.completed.listen(function () {
        if (cachedOption !== null && wx) {
            wx.onMenuShareAppMessage(cachedOption);
            if (cachedOption.timelineTitle) {
                cachedOption.title = cachedOption.timelineTitle;
            }
            wx.onMenuShareTimeline(cachedOption);
        }
    });
    
    module.exports = Actions;
    
    }).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    },{}],2:[function(require,module,exports){
    (function (global){
    'use strict';
    
    var React = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);
    var Router = (typeof window !== "undefined" ? window['react-router'] : typeof global !== "undefined" ? global['react-router'] : null);
    var RouteHandler = Router.RouteHandler;
    var reflux = (typeof window !== "undefined" ? window['reflux'] : typeof global !== "undefined" ? global['reflux'] : null);
    var actoins = require('./actions.js');
    var stores = require('./stores.js');
    
    var $ = (typeof window !== "undefined" ? window['jquery'] : typeof global !== "undefined" ? global['jquery'] : null);
    
    var WechatHandler = React.createClass({
        displayName: 'WechatHandler',
    
        mixins: [reflux.connect(stores.OpenIdStore, 'openid'), reflux.connect(stores.UserInfoStore, 'userInfo'), reflux.connect(stores.AccessTokenStore, 'token'), reflux.connect(stores.SubscribStatusStore, 'subcribed')],
    
        getParameterByName: function getParameterByName(name) {
            if (this.props.query[name]) {
                return this.props.query[name];
            }
            name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
            var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
                results = regex.exec(location.search);
            return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
        },
    
        getInitialState: function getInitialState() {
            if (this.getParameterByName('openid')) {
                stores.OpenIdStore.setOpenid(this.getParameterByName('openid'));
            }
            this.hasRequestUserInfo = false;
            this.hasRequestSubscirbeInfo = false;
    
            return {
                code: this.getParameterByName('code'),
                needOpenid: this.props.codeToOpenidAPI !== undefined
            };
        },
    
        getUserInfo: function getUserInfo() {
            // 防止多次请求
            if (this.state.openid && this.props.userInfoAPI && $.isEmptyObject(this.state.userInfo) && this.state.token) {
                // 获取用户信息
                if (!this.hasRequestUserInfo) {
                    actoins.getUserInfo(this.props.userInfoAPI, this.state.openid, this.state.token);
                    this.hasRequestUserInfo = true;
                }
            }
    
            if (this.state.openid && this.props.subscribedUserInfoAPI && !stores.SubscribStatusStore.tried) {
                // 获取用户是否关注了
                if (!this.hasRequestSubscirbeInfo) {
                    actoins.getSubscribedUserInfo(this.props.subscribedUserInfoAPI, this.state.openid);
                    this.hasRequestSubscirbeInfo = true;
                }
            }
        },
    
        componentDidMount: function componentDidMount() {
            actoins.requestJSSDKConfig(this.props.jssdkConfigAPI, '', this.props.jsAPIList, this.props.debug);
            if (this.state.needOpenid && ( // 需要openid
            !this.state.openid || // 但是没有openid
            this.props.userInfoAPI && !this.state.token) //或者说需要用户授权，但是没有token
             && this.state.code) {
                //而且有code
                // 请求授权
                actoins.requestOpenIdByCode(this.props.codeToOpenidAPI, this.state.code);
            };
            this.getUserInfo();
        },
    
        render: function render() {
            this.getUserInfo();
    
            if (this.state.needOpenid && !this.state.openid && !this.state.code) {
                return React.createElement(
                    'div',
                    { className: 'error' },
                    '请使用微信打开本页面'
                );
            };
    
            if (this.state.needOpenid && !this.state.openid && this.state.code) {
                return React.createElement(
                    'div',
                    { className: 'error' },
                    '页面授权登录中...'
                );
            }
    
            return React.createElement(RouteHandler, { key: 'wechatHandler' });
        }
    });
    
    module.exports = WechatHandler;
    
    }).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    },{"./actions.js":1,"./stores.js":4}],3:[function(require,module,exports){
    'use strict';
    
    var Wechat = {};
    
    Wechat.actions = require('./actions.js');
    Wechat.stores = require('./stores.js');
    Wechat.handler = require('./handler.js');
    
    module.exports = Wechat;
    
    },{"./actions.js":1,"./handler.js":2,"./stores.js":4}],4:[function(require,module,exports){
    (function (global){
    'use strict';
    
    var reflux = (typeof window !== "undefined" ? window['reflux'] : typeof global !== "undefined" ? global['reflux'] : null);
    var actions = require('./actions.js');
    var store = require('store2');
    
    var namespace = 'global';
    
    var setNameSpace = function setNameSpace(ns) {
        namespace = ns;
    };
    
    var OpenIdStore = reflux.createStore({
        init: function init() {
            this.listenTo(actions.requestOpenIdByCode.completed, this.onOpenidReceived);
        },
    
        getInitialState: function getInitialState() {
            this.openid = store.get(namespace, {}).openid;
            return this.openid;
        },
    
        onOpenidReceived: function onOpenidReceived(data) {
            this.openid = data.openid;
            this.saveToDb();
            this.trigger(this.openid);
        },
    
        setOpenid: function setOpenid(openid) {
            this.openid = openid;
            this.saveToDb();
            this.trigger(openid);
        },
    
        saveToDb: function saveToDb() {
            var db = store.get(namespace, {});
            db.openid = this.openid;
            store.set(namespace, db);
        }
    });
    
    var UserInfoStore = reflux.createStore({
        init: function init() {
            this.user = {};
            this.listenTo(actions.getUserInfo.completed, this.onUserInfoReceived);
            this.listenTo(actions.getSubscribedUserInfo.completed, this.onSubscribedUserInfoReceived);
        },
    
        getInitialState: function getInitialState() {
            return this.user;
        },
    
        onUserInfoReceived: function onUserInfoReceived(data) {
            this.user = data;
            this.trigger(data);
        },
    
        onSubscribedUserInfoReceived: function onSubscribedUserInfoReceived(data) {
            if (data.subscribe) {
                this.user = data;
                this.trigger(data);
            }
        }
    });
    
    var SubscribStatusStore = reflux.createStore({
        init: function init() {
            this.subcribed = false;
            this.tried = false;
            this.listenTo(actions.getSubscribedUserInfo.completed, this.onSubscribedUserInfoReceived);
            this.listenTo(actions.getSubscribedUserInfo, this.onStartToRequstSubecribedUserInfo);
        },
    
        getInitialState: function getInitialState() {
            return this.subcribed;
        },
    
        onStartToRequstSubecribedUserInfo: function onStartToRequstSubecribedUserInfo() {
            this.tried = true;
        },
    
        onSubscribedUserInfoReceived: function onSubscribedUserInfoReceived(data) {
            this.subcribed = data.subscribe === 1;
            this.trigger(this.subcribed);
        }
    });
    
    var AccessTokenStore = reflux.createStore({
        init: function init() {
            var db = store.get(namespace, {});
            this.token = db.token || '';
    
            if (this.token) {
                // 检查是否过期
                var expiresIn = db.expiresIn || 0;
                var fetchTime = db.fetchTime;
                var now = new Date();
                if (fetchTime && now - fetchTime > expiresIn) {
                    this.token = '';
                }
            }
            this.listenTo(actions.requestOpenIdByCode.completed, this.onAuthReceived);
        },
    
        getInitialState: function getInitialState() {
            return this.token;
        },
    
        onAuthReceived: function onAuthReceived(data) {
            this.token = data.access_token;
            this.saveToDb(this.token, data.expires_in);
            this.trigger(this.token);
        },
    
        saveToDb: function saveToDb(token, expiresIn) {
            var db = store.get(namespace, {});
            db.token = this.token;
            db.expiresIn = expiresIn;
            db.fetchTime = new Date();
            store.set(namespace, db);
        }
    });
    
    var JsSDKStatusStore = reflux.createStore({
        init: function init() {
            this.status = false;
            this.listenTo(actions.initJSSDKSettings.completed, this.onInitCompleted);
        },
    
        getInitialState: function getInitialState() {
            return this.status;
        },
    
        onInitCompleted: function onInitCompleted() {
            this.status = true;
            this.trigger(this.status);
        }
    });
    
    var LocationStore = reflux.createStore({
        init: function init() {
            this.listenTo(actions.getWXLocation.completed, this.onGetLocationCompleted);
        },
    
        onGetLocationCompleted: function onGetLocationCompleted(data) {
            this.trigger(data);
        }
    });
    
    module.exports = {
        setNameSpace: setNameSpace,
        OpenIdStore: OpenIdStore,
        UserInfoStore: UserInfoStore,
        SubscribStatusStore: SubscribStatusStore,
        AccessTokenStore: AccessTokenStore,
        JsSDKStatusStore: JsSDKStatusStore,
        LocationStore: LocationStore
    };
    
    }).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    },{"./actions.js":1,"store2":undefined}]},{},[3])(3)
    });