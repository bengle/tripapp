/**
 * header @markzhi.com
 */

define(function (require, exports, module) {
  var $ = require('jquery'),
    Dialog = require('dialog'),
    content = '<p class="tool_tips">嘿！知道吗？你在浏览任何网站时都可以随时收藏发现，仅需要添加'+
        '<a href="http://faxianla.com/help/marktool.action" target="_blank" class="mark_tool" title="发现啦!">“+发现”按钮！</a></p>' +
        '<p><a class="add_mark tool_btn" href="#!/add_mark" data-action="addMark" data-tab-idx="0">网页发现<b></b></a><a  class="upload tool_btn" href="#!/add_mark" data-action="addMark" data-tab-idx="1">本地上传<b></b></a><a  class="tool_btn add_board" href="#!/add_board" data-action="addBoard">添加发现板<b></b></a></p>';

  // action map
  var map = {
    "addMark":"./mods/add_mark",
    "addBoard":"./mods/add_board"
  };
    function doAction(elem, evt) {
        var action;
        if (elem.tagName.toLowerCase() === 'a' && /#!/.test(elem.href)) {
            evt.preventDefault();
            elem = $(elem);
            action = elem.attr('data-action');
            if (action) {
                var dialog = Dialog.get(action).show();
                if (!elem.attr('data-init')) {
                    if (action === 'showTools') {
                        var d = Dialog.get(action)
                            .head($(elem).html())
                            .body(content);

                        d.elem.addClass('dialog_tools');
                        d.elem.find('.tool_btn').click(function(e) {
                            var elem = e.target;
                            if (elem.tagName.toLowerCase() === 'b' )  elem = $(elem).parent()[0];
                            doAction(elem, e);
                            d.hide();
                        });
                        d.show();

                        // 调整 upload 宽度
                        var up = d.elem.find('.upload'),
                            prt = up.parent(),
                            prev = up.prev('a'), next = up.next('a');
                        up.width(prt.width()-prev.outerWidth(true)-next.outerWidth(true)-2);
                    } else {
                        // get this mod
                        require.async(map[action], function (mod) {
                            mod.init(elem);
                        });
                    }
                    elem.attr('data-init', 1);
                } else {
                    var tab_idx = elem.attr('data-tab-idx');
                    tab_idx && dialog.switchTabTo(parseInt(tab_idx));
                }
            }
        }
    }

  $('#menu').click(function (evt) {
      doAction(evt.target, evt);
  });

    // 浮层登录框
    var LoginHook = 'show-login-box',
        lb_tpl = $('#login_box_tpl');
    if (lb_tpl[0]) {
        $('.'+LoginHook).click(function(evt) {
            evt.preventDefault();
            var loginbox = Dialog.get(LoginHook).head('经常登录的同学都有好品位').body(lb_tpl.html());
            loginbox.elem.addClass('dialog-login');
            loginbox.show();
        });
    }

    // 鼠标提到用户小图， 出现 User Profile 浮层
    var up_tpl = $('#user_profile_tpl');
    if (up_tpl.length) {
        require.async('mustache', function(Mustache) {

            var userOverlay,
                showing = false,
                hideTimer, showTimer,
                doAction = {
                    follow:function (elem) {
                        var txt = '';
                        var url = elem.href.replace(/^[^#]+/, '');
                        url = url.replace('#!', '');

                        elem = $(elem);
                        if (elem.html() === '处理中..') return;
                        txt = elem.html();
                        elem.html('处理中..');

                        $.ajax({
                            url:url,
                            cache:false,
                            dataType: 'json',
                            success:function (result) {
                                if (true === result.success) {
                                    elem.html(result.data.type ? '取消关注' : '关注');

                                    if (!!result.data.type) {
                                        elem.removeClass('follow');
                                        elem.addClass('unfollow');
                                    } else {
                                        elem.removeClass('unfollow');
                                        elem.addClass('follow');
                                    }
                                } else {
                                    alert(result.message);
                                    elem.html(txt);
                                }
                            },
                            error:function () {
                                alert('貌似服务器泡妞去了，要不你稍后试试～');
                                elem.html(txt);
                            }
                        });
                    }

                };
            function align(elem) {
                if (showing) {
                    if (elem.find('img').length) elem = elem.find('img').eq(0);
                    var offset = elem.offset(),
                        left = Math.min(offset.left - 20, $(window).width()-userOverlay.outerWidth()-30);
                    userOverlay.css({
                        left: left,
                        top: offset.top - userOverlay.outerHeight() - 4
                    });
                    userOverlay.find('.arrow').css({
                        left: offset.left - left
                    });
                }
            }
            function show(elem) {
                showing = true;
                if (!userOverlay) {
                    userOverlay = $('<div id="user_profile_pop" class="ui-dialog "></div>').appendTo('body');
                    userOverlay.click(function(evt) {
                        var elem = evt.target;
                        if (elem.tagName.toLowerCase() === 'a' && /#!/.test(elem.href)) {
                            evt.preventDefault();
                            var action = $(elem).attr('data-action');

                            action && doAction[action](elem);
                        }
                    }).hover(function() {
                        if (hideTimer) {
                            clearTimeout(hideTimer);
                            hideTimer = null;
                        }
                    }, laterHide);
                }
                
                userOverlay.addClass('loading').html('<p class="message"><img src="http://pic.yupoo.com/ucdcn_v/BCGxGvxE/BkiiL.gif" />加载中...</p><b class="arrow"><i class="arrow_inner"></i></b>').show();

                align(elem);

                var userId = elem.attr('data-user-profile').replace(/\//, '');
                $.ajax({
                    url: '/member/miniProfile.jsn?'+userId,
                    dataType: 'json'
                }).success(function(result) {
                    if (result.data) {
                        result.isSelf = result.data.follow=== '';
                    }

                    userOverlay.html(Mustache.to_html(up_tpl.html(), result));
                    userOverlay.removeClass('loading');
                    align(elem);
                }).error(function() {
                    userOverlay.html('<p class="message">貌似服务器泡妞去了，要不你稍后试试～</p>');
                    userOverlay.removeClass('loading');
                    align(elem);
                });
            }
            function hide() {
                showing = false;
                userOverlay.hide();
            }
            function laterHide() {
                hideTimer = setTimeout(function() {
                    hide();
                }, 300);
                if (showTimer) {
                    clearTimeout(showTimer);
                    showTimer = null;
                }
            }
            $('a[data-user-profile^="id="]').live('mouseenter', function() {
                var elem = $(this);
                if (hideTimer) {
                    clearTimeout(hideTimer);
                    hideTimer = null;
                }

                if (showTimer) clearTimeout(showTimer);
                showTimer = setTimeout(function() {
                    show(elem);
                }, 300);
            }).live('mouseleave', laterHide);

        });
    }

  /*
  function cookie(name, val, exports, domain, path) {

    var doc = document, m = doc.cookie.match('(?:^|;)\\s*' + name + '=([^;]*)');

    // get
    if (!val) {
      return (m && m[1]) ? decodeURIComponent(m[1]) : '';
    }

    // set
    var text = encodeURIComponent(val), date = expires;

    // 从当前时间开始，多少天后过期
    if (typeof date === 'number') {
      date = new Date();
      date.setTime(date.getTime() + expires * 86400000);
    }
    // expiration date
    if (date instanceof Date) {
      text += '; expires=' + date.toUTCString();
    }

    // domain
    if ('' !== domain) {
      text += '; domain=' + domain;
    }

    // path
    if ('' !== path) {
      text += '; path=' + path;
    }

    doc.cookie = name + '=' + text;
  }

  if (!cookie('_c') && !$('#detail')[0]) {
    var c = '', ed = cookie('');
    $('<div id="tips"><a href="#close" class="close">关闭提示</a>我们发现您正在使用 Internet Explorer 7.0 或者其内核浏览器，我们强烈建议您使用 <a href="http://www.google.com/chrome/?hl=zh_CN">谷歌浏览器</a> 或者 <a href="http://firefox.com.cn/">火狐浏览器</a> 来获取更好的体验，<a href="http://markzhi.com/not-supported.html">点此查看更多浏览器</a>！</div>').insertBefore('#header > :first').find('a.close').click(function (evt) {
      evt.preventDefault();
      $(this).parent().remove();
      cookie('_c', '1', 14, document.domain, '/');
    });
  }  */
}); 
	
