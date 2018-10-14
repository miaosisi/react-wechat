"use strict";

var reflux = require("reflux");
var actions = require("./actions.js");
var store = require("store2");

var namespace = "global";

var setNameSpace = function setNameSpace(ns) {
    namespace = ns;
};

var OpenIdStore = reflux.createStore({
    init: function init() {
        this.listenTo(
            actions.requestOpenIdByCode.completed,
            this.onOpenidReceived
        );
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
        this.listenTo(
            actions.getSubscribedUserInfo.completed,
            this.onSubscribedUserInfoReceived
        );
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
        this.listenTo(
            actions.getSubscribedUserInfo.completed,
            this.onSubscribedUserInfoReceived
        );
        this.listenTo(
            actions.getSubscribedUserInfo,
            this.onStartToRequstSubecribedUserInfo
        );
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
        this.token = db.token || "";

        if (this.token) {
            // 检查是否过期
            var expiresIn = db.expiresIn || 0;
            var fetchTime = db.fetchTime;
            var now = new Date();
            if (fetchTime && now - fetchTime > expiresIn) {
                this.token = "";
            }
        }
        this.listenTo(
            actions.requestOpenIdByCode.completed,
            this.onAuthReceived
        );
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
        this.listenTo(
            actions.initJSSDKSettings.completed,
            this.onInitCompleted
        );
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
        this.listenTo(
            actions.getWXLocation.completed,
            this.onGetLocationCompleted
        );
    },

    onGetLocationCompleted: function onGetLocationCompleted(data) {
        console.log(data);
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
