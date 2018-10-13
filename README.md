# React-wechat 组件

本组件用于在 React, react-router 及 reflux 环境下的微信基本组件，目前实现的功能：

- 权限控制
- jssdk 载入
- 个人信息获取(需要远程 api)
- 换取 openid（并缓存）
- 地理位置
- 分享

用法:

```javascript
var wechat = require('react-wechat');
var WechatHandler = wechat.handler;

var ConfigedWechatHandler = React.createClass({
    render: function(){
        return <WechatHandler
            jssdkConfigAPI='获取jssdk的config的api地址',
						codeToOpenidAPI='授权登录用code换openid的api的地址',
						userInfoAPI='获取用户信息的api地址,这个api的授权域必须是snsapi_userinfo',
            subscribedUserInfoAPI='获取用户是否关注了的地址',
            jsAPIList={[
                'getLocation',
                'onMenuShareTimeline',
                'onMenuShareAppMessage',
            ]}
            { ... this.props }
            />;
    }
});

// 设置路由
var routes = <Route handler={App}>
        <Route handler={ConfigedWechatHandler}>
					... //需要微信信息的view
        </Route>
    </Route>;


//设置分享
wechatActions.getUserInfo.completed.listen(function(data){
		// 获得了个人信息后分享
    wechatActions.setShareContent({
        title: data.nickname + '邀你一起赢大奖！',
        link: '', // 不填地址即为当前地址
        imgUrl: 'img/share.jpg',
        desc: '描述',
    }, '开发者appkey'); //分享的是授权链接
});

wechatActions.initJSSDKSettings.completed.listen(function(){
		// 初始化后立即设置分享内容
    wechatActions.setShareContent({
        title: '一起赢大奖',
        link: '#',
        imgUrl: 'img/share.jpg',
        desc: '描述',
    }); // 不填appkey则分享的是直接的链接
});
```
