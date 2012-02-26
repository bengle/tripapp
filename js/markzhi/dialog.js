/**
 * simple dialog
 */

define(["jquery"], function(require, exports, module) {
    var $ = require('jquery');
    var _id_counter = 0,


    /**
         * 所有自定义事件列表
         */
        EVENT_LIST = {
            "CENTER": "center",
            "BEFORESHOW": "beforeShow",
            "SHOW": "show",
            "BEFOREHIDE": "beforeHide",
            "HIDE": "hide"
        };

    function Dialog (config) {
        var self = this, cfg = self.config;
        cfg = mix(
            {
                id: null,
                width: '630',
                center: true,
                mask: true,
                close: true,
                className : 'ui-dialog',
                tpl: '<div id="%ID" class="%CLASSNAME"><div class="hd">正在加载</div><div class="bd"><div class="ui-loading">正在加载...</div></div><a class="ui-close" href="#close">X</a></div>'
            }, config || {}
        );
        cfg.id = cfg.id || 'ui-dialog-' + counter();
        self.config = cfg;

        self._createHTML();

    /*$(this).bind('show', function(evt) {
         $(document.body).keyup(function(evt) {
         if (27 === evt.keyCode && 200 === self._status) {
         self.hide();
         }
         });
         });
         $(this).bind('hide', function(evt) {
         $(document.body).unbind('keyup', function(evt) {
         if (27 === evt.keyCode && 200 === self._status) {
         self.hide();
         }
         });
         });*/
    }

    mix(Dialog.prototype, {

    /*
         * 内部状态码 400为hide, 200为show
         *
         * */
        _status: 400,

    /**
         * isShow
         */
        isShow: function() {
            return this._status === 200;
        },

    /**
         * width
         */
        width: function( px ) {
            var self = this;
            self.elem.width(px);
            self.center();
            return self;
        },

    /**
         * 居中 return this
         */
        center: function() {
            if ( 400 === this._status ) return;
            var self = this, elem = self.elem, w = $(window),
                x = w.width(), y = w.height();

            elem.css( 'top', ( y - elem.height() ) / 2  + (self._isIE6?w.scrollTop():0)  );
            elem.css( 'left', ( x - elem.width() ) / 2  + (self._isIE6?w.scrollLeft():0)  );

            self.config.mask && self._isIE6 && self.mask.css('height', $(document).height());
            $(self).triggerHandler( EVENT_LIST.CENTER );
            return self;
        },

    /**
         * setHeader
         */
        head: function(str) {
            var self = this, elem = self.elem.children('div.hd');
            elem.html(str);
            return self;
        },
    /**
         * setbody
         */
        body: function(str) {
            var self = this, elem = self.elem.children('div.bd');
            elem.html(str);
            return self;
        },

    /**
         * show
         */
        show: function() {
            var self = this, cfg = this.config, elem = self.elem, css = {"visibility": "", "opacity": 0},
                version = parseInt($.browser.version, 10);
            $(self).triggerHandler( EVENT_LIST.BEFORESHOW );
            self._status = 200;
            if(true === cfg.center) self.center();

            cfg.mask && self.mask.css({"visibility": ""});
            if ( $.browser.msie && version < 9 ) {
                if (self._isIE6 && cfg.mask) {
                    self.mask.css({"position":'absolute', "height": $(document).height()});
                }
                elem.css({"visibility": ""});
                $(self).triggerHandler( EVENT_LIST.SHOW );
            } else {
                elem.css(css);
                elem.animate({opacity: 1}, 300, function() {
                    $(self).triggerHandler( EVENT_LIST.SHOW );
                });
            }

            return self;
        },

    /**
         * hide
         */
        hide: function() {
            var self = this,  cfg = self.config, elem = self.elem;
            if ( 400 === self._status ) return;
            $(self).triggerHandler( EVENT_LIST.BEFOREHIDE );
            self._status = 400;

            elem.animate({opacity: 0}, 300, function() {
                elem.css({"visibility": "hidden", "opacity": ""});
                if (cfg.mask) {
                    self.mask.css({"visibility": "hidden"});
                }
                $(self).triggerHandler( EVENT_LIST.HIDE );
            });

            return self;
        },


        _createHTML: function() {
            var self = this, cfg = self.config, timer = null;
            var dialog = $(cfg.tpl.replace(/%ID/, cfg.id).replace(/%CLASSNAME/, cfg.className));
            dialog.css({"visibility": "hidden", "width": cfg.width});

            // 关闭按钮
            if(true === cfg.close) {
                $(dialog).find('> a.ui-close').click(function(evt) {
                    evt.preventDefault();
                    self.hide();
                });
            } else {
                dialog.html('');
            }
            self.elem = dialog;
            $('body').append(dialog);

            // 初始化遮罩层
            if(true === cfg.mask) {
                //var mask = $('mask');
                var mask = $('<div id="'+ cfg.id +'_mask" class="ui-mask"></div>');
                mask.css({
                    //"height": $(window).height(),
                    "visibility": "hidden"
                });
                self.mask = mask;
                $('body').append(mask);
            }

            $(window).resize(function() {
                if ( timer !== null ) return;
                timer = setTimeout(function() {
                    timer = null;
                    self.center();
                }, 300);
            });

            if ($.browser.msie && parseInt($.browser.version, 10) < 7 ) {
                self._isIE6 = true;
                $(window).scroll(function() {
                    if ( timer !== null ) return;
                    timer = setTimeout(function() {
                        timer = null;
                        self.center();
                    }, 300);
                });
            }
        }
    });


    function mix(r, s) {
        for (var k in s) {
            r[k] = s[k];
        }
        return r;
    }

    function counter() {
        return _id_counter++;
    }


    module.exports = {
        _list: {},
        get: function(id, config) {
            var self = this, list = self._list;
            if(!id || !list[id]) {
                var D = new Dialog(config);
                id = !id ? D.elem[0].id : id;
                list[id] = D;
            }
            return list[id];
        }
    };
});
