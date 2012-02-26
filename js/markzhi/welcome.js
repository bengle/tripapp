/**
 * portal 页， 未登录情况下
 * @author liz
 */
define(function (require, exports, module) {
    var $ = require('jquery'),
        _ = require('underscore'),
        Dialog = require('dialog'),
        LoginHook = 'show-login-box';

    return {
        startScroll: function() {
            var self = this;

            self.scrollTimer = setInterval(function() {
                self._position += 5;
                $('body, html').animate({scrollTop:self._position}, 220);
                $('body').css('overflow', 'hidden');
            }, 220);
        },
        stopScroll: function() {
            var self = this;
            if (self.scrollTimer) {
                clearInterval(self.scrollTimer);
                self.scrollTimer = null;

                $('body, html').clearQueue().stop(true, true);
                $('body').css('overflow', '');

            }
        },
        init: function() {
            var self = this;
            // 检测用户停留10s后，显示登录框且自动滚页面
            _.delay(function() {
                var loginElem = $('.'+LoginHook);
                if (loginElem.length) {
                    var dialog = Dialog.get(LoginHook);
                    if (dialog && dialog.elem && dialog.elem.css('display') !== 'none' && dialog.elem.css('visibility') !== 'hidden') return;

                    loginElem.first().click();
                    if (window['FXL_IE6']) return;

                    _.delay(function() {
                        self._position = $(window).scrollTop();
                        self.startScroll();
                        var loginBox = $(Dialog.get(LoginHook));
                        loginBox.bind('hide', function() {
                            self.stopScroll();
                        });
                        loginBox[0].elem.find('input').bind('focus', function() {
                            self.stopScroll();
                        });

                        // 自动滚动了2分钟后，停止滚动
                        _.delay(function() {
                            self.stopScroll();
                        }, 120000);
                    }, 200);
                }
            }, 10000);


            // unlogin home
            var intro = $('#intro');
            if (intro[0]) {
                require.async('jquery.ui', function (mod) {
                    mod($);
                    require.async('jquery.ui.tabs', function (mod) {
                        mod($);
                        var c = {event:'mouseover'};
                        !$.browser.msie && (c.fx = {opacity:'toggle'});

                        intro.tabs(c).tabs('rotate', 5000);
                    });
                });

                intro.find('.mark_tool').click(function (evt) {
                    evt.preventDefault();
                    if ($.browser.msie) {
                        alert('请右键点击我，选择 "添加到收藏夹"。');
                    } else {
                        alert('请把我拖到书签栏哦.');
                    }
                });
            }
        }
    }

});