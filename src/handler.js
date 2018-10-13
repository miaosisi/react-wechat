"use strict";

var React = require("react");
var Router = require("react-router");
var RouteHandler = Router.RouteHandler;
var reflux = require("reflux");
var actoins = require("./actions.js");
var stores = require("./stores.js");

var $ = require("jquery");

var WechatHandler = React.createClass({
    mixins: [
        reflux.connect(
            stores.OpenIdStore,
            "openid"
        ),
        reflux.connect(
            stores.UserInfoStore,
            "userInfo"
        ),
        reflux.connect(
            stores.AccessTokenStore,
            "token"
        ),
        reflux.connect(
            stores.SubscribStatusStore,
            "subcribed"
        )
    ],

    getParameterByName(name) {
        if (this.props.query[name]) {
            return this.props.query[name];
        }
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null
            ? ""
            : decodeURIComponent(results[1].replace(/\+/g, " "));
    },

    getInitialState: function() {
        if (this.getParameterByName("openid")) {
            stores.OpenIdStore.setOpenid(this.getParameterByName("openid"));
        }
        this.hasRequestUserInfo = false;
        this.hasRequestSubscirbeInfo = false;

        return {
            code: this.getParameterByName("code"),
            needOpenid: this.props.codeToOpenidAPI !== undefined
        };
    },

    getUserInfo: function() {
        // 防止多次请求
        if (
            this.state.openid &&
            this.props.userInfoAPI &&
            $.isEmptyObject(this.state.userInfo) &&
            this.state.token
        ) {
            // 获取用户信息
            if (!this.hasRequestUserInfo) {
                actoins.getUserInfo(
                    this.props.userInfoAPI,
                    this.state.openid,
                    this.state.token
                );
                this.hasRequestUserInfo = true;
            }
        }

        if (
            this.state.openid &&
            this.props.subscribedUserInfoAPI &&
            !stores.SubscribStatusStore.tried
        ) {
            // 获取用户是否关注了
            if (!this.hasRequestSubscirbeInfo) {
                actoins.getSubscribedUserInfo(
                    this.props.subscribedUserInfoAPI,
                    this.state.openid
                );
                this.hasRequestSubscirbeInfo = true;
            }
        }
    },

    componentDidMount: function() {
        actoins.requestJSSDKConfig(
            this.props.jssdkConfigAPI,
            "",
            this.props.jsAPIList,
            this.props.debug
        );
        if (
            this.state.needOpenid && // 需要openid
            (!this.state.openid || // 但是没有openid
                (this.props.userInfoAPI && !this.state.token)) && //或者说需要用户授权，但是没有token
            this.state.code
        ) {
            //而且有code
            // 请求授权
            actoins.requestOpenIdByCode(
                this.props.codeToOpenidAPI,
                this.state.code
            );
        }
        this.getUserInfo();
    },

    render: function() {
        this.getUserInfo();

        if (this.state.needOpenid && !this.state.openid && !this.state.code) {
            return <div className="error">请使用微信打开本页面</div>;
        }

        if (this.state.needOpenid && !this.state.openid && this.state.code) {
            return <div className="error">页面授权登录中...</div>;
        }

        return <RouteHandler key="wechatHandler" />;
    }
});

module.exports = WechatHandler;
