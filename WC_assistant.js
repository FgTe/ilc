import axios from 'axios';
import wx from 'weixin-js-sdk';

import server from './config.js'

let WCAssistant = {
    jsTicketCorrespondingURL: null,
    resigned: false,
    resignedURL: '',
    signing: false,
    signingPromise: null,
    signingCancelToken: null,
    configSuccess: false,
    signJsTicket (api) {
        let currentURL = `${window.location.origin}${window.location.pathname}${window.location.search}`;
        if ( WCAssistant.signingPromise && ( WCAssistant.configSuccess || WCAssistant.signing ) ) {
            return WCAssistant.signingPromise;
        }
        WCAssistant.jsTicketCorrespondingURL = currentURL;
        WCAssistant.signingPromise = new Promise ((resolve, reject) => {
            WCAssistant.signing = true;
            axios.post(`${server}/extra/b/weixin/signJsTicket`, {
                "seqNo": Date.now(),
                "system": "ksf_manage",
                "request": {
                    "url": currentURL
                }
            }, {
                cancelToken: new axios.CancelToken(function (c) { WCAssistant.signingCancelToken = c; })
            }).then((res) => {
                if ( res.data.code === 100 ) {
                    setTimeout(() => {
                        WCAssistant.configSuccess = undefined;
                        wx.config({
                            debug: false,
                            appId: res.data.response.appId,
                            timestamp: res.data.response.timestamp,
                            nonceStr: res.data.response.nonceStr,
                            signature: res.data.response.signature,
                            jsApiList: ['getLocation','scanQRCode','hideOptionMenu','chooseImage','uploadImage','translateVoice']
                        });
                        wx.ready(() => {
                            setTimeout(() => {
                                WCAssistant.signing = false;
                                if ( WCAssistant.configSuccess === undefined ) {
                                    WCAssistant.configSuccess = true;
                                    resolve(wx);
                                }
                            }, 1000)
                        });
                        wx.error((err) => {
                            WCAssistant.configSuccess = false;
                            reject(err, wx);
                        });
                    }, 1000);
                } else {
                    reject(new Error(`${res.data.code}:${res.data.des}`));
                }
            }, (err) => {
                reject(err);
            })
        });
        return WCAssistant.signingPromise;
    },
    updateJsTiket (api) {
        WCAssistant.configSuccess = false;
        return WCAssistant.signJsTicket(api);
    },
    resign (api, resolve, reject) {
        if ( !WCAssistant.resigned && WCAssistant.resignedURL !== window.location.href ) {
            WCAssistant.resigned = true;
            return WCAssistant.updateJsTiket(api).then(() => {
                WCAssistant.resignedURL = window.location.href;
                WCAssistant.resigned = false;
                resolve();
            });
        } else {
            reject();
        }
    },
    getWeChatAccessCode (redirectURI) {
        return new Promise ((resolve, reject) => {
            let search = /(\?.+?)(?:#|$)/.exec( redirectURI ? encodeURI(redirectURI) : window.location.href );
            let codeMatched = search && search[1].match(/code=([\w().!~*'-]+)/);
            let stateMatched =  search && search[1].match(/state=([\w().!~*'-]+)/);
            if ( codeMatched ) {
                resolve({
                    code: codeMatched[1],
                    state: stateMatched && stateMatched[1]
                });
            } else {
                axios.get(`${server}/extra/b/weixin/getAppId`).then(res => {
                    if ( res.data.code == 100 ) {
                        let appId = res.data.response;
                        window.location.href = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + appId + "&redirect_uri=" + encodeURIComponent(redirectURI || window.location.href) + "&response_type=code&scope=snsapi_userinfo#wechat_redirect";
                        // setTimeout(() => { alert('需要获得你的公开信息才能正常使用') }, 3500)
                    } else {
                        alert(res.data.des);
                        reject(new Error('failed to get app_id: ' + res.data.des));
                    }
                });
            }
        })
    },
    getLocation () {
        return WCAssistant.signJsTicket(null, 'getLocation').then((wx) => {
            return new Promise((resolve, reject) => {
                let status = -1;
                setTimeout(() => {
                    if ( status === -1 ) {
                        status = -2;
                        reject(new Error('timeout'));
                    }
                }, 5000);
                wx.getLocation({
                    type: 'wgs84',
                    success: (res) => {
                        if ( status !== -2 ) {
                            status = 0;
                            resolve(res);
                        }
                    },
                    fail: (err) => {
                        if ( status !== -2 ) {
                            WCAssistant.resign('getLocation', () => {
                                resolve(WCAssistant.getLocation());
                            }, () => {
                                status = 1;
                                reject(err);
                            })
                        }
                    }
                });
            })
        });
    },
    getNetworkType () {
        return WCAssistant.signJsTicket(null, 'getNetworkType').then((wx) => {
            return new Promise((resolve, reject) => {
                wx.getNetworkType({
                    success: (res) => {
                        resolve(res);
                    },
                    fail: (err) => {
                        WCAssistant.resign('getNetworkType', () => {
                            resolve(WCAssistant.getNetworkType());
                        }, () => {
                            reject(err);
                        })
                    }
                });
            })
        });
    },
    scanQRCode () {
        return WCAssistant.signJsTicket(null, 'scanQRCode').then((wx) => {
            return new Promise((resolve, reject) => {
                wx.scanQRCode({
                    needResult: 1,
                    scanType: ["qrCode"],
                    success: (res) => {
                        resolve(res);
                    },
                    fail: (err) => {
                        WCAssistant.resign('scanQRCode', () => {
                            resolve(WCAssistant.scanQRCode());
                        }, () => {
                            reject(err);
                        })
                    }
                });
            })
        })
    },
    hideOptionMenu () {
        WCAssistant.signJsTicket(null, 'hideOptionMenu').then((wx) => {
            wx.hideOptionMenu();
        });
    }
}

export default WCAssistant;