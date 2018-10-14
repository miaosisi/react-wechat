"use strict";

var reflux = require("reflux");
var $ = require("jquery");

var Actions = reflux.createActions({
    requestOpenIdByCode: { asyncResult: true },
    requestJSSDKConfig: { asyncResult: true },
    getUserInfo: { asyncResult: true },
    loadWechatLib: { asyncResult: true },
    initJSSDKSettings: { asyncResult: true },
    getWXLocation: { asyncResult: true },
    getSubscribedUserInfo: { asyncResult: true },
    setShareContent: { children: ["shareCompleted", "shareCanceled"] }
});

var getCurrentUrl = function getCurrentUrl() {
    return window.location.href.replace(/#.*$/, "");
};

var getBaseUrl = function getBaseUrl() {
    return getCurrentUrl().replace(/\/[^\/]*$/, "/");
};

var getExternalUrl = function getExternalUrl(url) {
    return /^(http:|https:)/.test(url) ? url : getBaseUrl() + url;
};

Actions.requestOpenIdByCode.listen(function(apiUrl, code) {
    $.ajax({
        url: apiUrl,
        type: "get",
        data: {
            code: code
        },
        dataType: "json",
        success: this.completed,
        error: this.failed
    });
});

Actions.getUserInfo.listen(function(apiUrl, openid, token) {
    var self = this;
    $.ajax({
        url: apiUrl,
        type: "post",
        data: {
            openid: openid,
            access_token: token
        },
        dataType: "json",
        success: this.completed,
        error: function error(xhr) {
            alert(xhr.responseText);
            self.failed();
        }
    });
});

Actions.getSubscribedUserInfo.listen(function(apiUrl, openid) {
    var self = this;
    $.ajax({
        url: apiUrl,
        type: "post",
        data: {
            openid: openid
        },
        dataType: "json",
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

Actions.requestJSSDKConfig.listen(function(
    apiUrl,
    location,
    _jsApiList,
    _debug
) {
    jsApiList = _jsApiList;
    debug = _debug || false;

    if (!location) {
        location = getCurrentUrl();
    }

    $.ajax({
        url: apiUrl,
        type: "get",
        data: {
            url: location
        },
        dataType: "json",
        success: this.completed,
        error: this.failed
    });
});

Actions.loadWechatLib.listen(function() {
    // load wechat js
    var script = document.createElement("script");
    script.async = "async";
    script.src = "http://res.wx.qq.com/open/js/jweixin-1.0.0.js";
    script.onload = this.completed;
    document.getElementsByTagName("head")[0].appendChild(script);
});

// 获取设置后，立即载入lib
Actions.requestJSSDKConfig.completed.listen(function(_config) {
    config = _config;
    Actions.loadWechatLib();
});

// 载入lib后，立即初始化JSSDK
Actions.loadWechatLib.completed.listen(function() {
    Actions.initJSSDKSettings(jsApiList, config);
});

var isJssdkReady = false;

Actions.initJSSDKSettings.listen(function(jsAPIList, _config) {
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
        wx.ready(function() {
            isJssdkReady = true;
            self.completed();
        });
        wx.error(function(res) {
            console.error(res);
            self.failed(res);
        });
    } else {
        self.failed("no wx");
    }
});

Actions.getWXLocation.listen(function() {
    if (wx) {
        wx.getLocation({
            success: this.completed
        });
    } else {
        this.failed("no wx");
    }
});

var cachedOption = null;

Actions.setShareContent.listen(function(options, appid, scope) {
    options.link = getExternalUrl(options.link);
    scope = scope || "snsapi_base";
    if (appid) {
        options.link =
            "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" +
            appid +
            "&redirect_uri=" +
            encodeURIComponent(options.link) +
            "&response_type=code&scope=" +
            scope +
            "&state=STATE#wechat_redirect";
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

Actions.initJSSDKSettings.completed.listen(function() {
    if (cachedOption !== null && wx) {
        wx.onMenuShareAppMessage(cachedOption);
        if (cachedOption.timelineTitle) {
            cachedOption.title = cachedOption.timelineTitle;
        }
        wx.onMenuShareTimeline(cachedOption);
    }
});

module.exports = Actions;
