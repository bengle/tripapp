/**
 * mark_list
 *
 * Macji <xiaomacji(at)gmail.com>
 */
define(function (require, exports, module) {
  var $ = require('jquery'),
    _ = require('underscore'),
    Mustache = require('mustache'),
    Dialog = require('dialog'),
    Canvas = require('./canvas');

  this.MarkList = {};

  function len(val) {
    return val.replace(/[^x00-xff]/g, 'aa').length;
  }

  _.extend(this.MarkList, {

    /**
     * follow && unfollow
     */
    follow:function (mark, elem) {
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
        success:function (result) {
          result = eval('(' + result + ')');
          if (true === result.success) {
            var f = 'follow', unf = 'un' + f;
            elem.html(result.data.type ? '取消关注' : '关注');
            if (!!result.data.type) {
              // unfollow
              elem.removeClass(f);
              elem.addClass(unf);
            } else {
              elem.removeClass(unf);
              elem.addClass(f);
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
    },

    /**
     * 评论, 对某个mark进行评论
     */
    comment:function (mark) {
      var self = this, dialog = self.commentDialog;
      self._markElem = mark;

      if (!dialog) {
        dialog = Dialog.get('comment', {
          mask:true, width:'460',
          className:'ui-dialog popup_comment'
        });
        dialog.head('添加评论');
        dialog.body($('#comment_tpl').html());

        var form = dialog.elem.find('form'),
          btn = form.find('button'), txt = btn.html();

        // reset id and textarea
        $(dialog).bind('beforeShow', function (evt) {
          var text = $('#popup_comment_content');
          $('#popup_comment_id').val(self._markElem.attr('data-id'));
          text.val('');
          setTimeout(function () {
            text.focus();
          }, 0);
        });

        $('#popup_comment_content').keydown(function (evt) {
          var code = evt.keyCode;
          if (evt.ctrlKey && 13 === code) {
            form.submit();
          }
        });

        form.submit(function (evt) {
          evt.preventDefault();
          var l = $.trim(form.find('textarea').val());
          //if (140 <= len(l)) return alert('评论字数不能大于140个字');
          if ('' === l) return alert('好歹也写点东西阿!');
          if (btn.html() === (txt + 'ing')) return;
          btn.html(txt + 'ing');

          $.ajax({
            type:form.attr('method'),
            url:form.attr('action'),
            data:form.serialize()
          })
            .error(function () {
              alert('貌似服务器泡妞去了，要不你稍后试试～');
              btn.html(txt);
            })
            .success(function (result) {
              result = eval('(' + result + ')');
              if (true === result.success) {
                // add to mark elem
                var ul = self._markElem.find('ul.comments'),
                  col = self._markElem.attr('class').match(/col\-(\d)/),
                  data = result.data;

                ul.append(Mustache.to_html($('#comment_item_tpl').html(), data));
                self._markElem.css('height', '');
                self.resetPosition(col[1], function () {
                  var li = ul.children(':last');
                  $('body, html').animate({
                    scrollTop:li.position().top + self._markElem.position().top
                  }, 'slow', function () {
                    li.css({'opacity':0});
                    li.animate({'opacity':1}, 'slow');
                  });
                });

                dialog.hide();
              } else {
                alert(result.message);
              }
              btn.html(txt);
            });
        });
        self.commentDialog = dialog;
      }
      dialog.show();
    },

    /**
     * remark
     */
    remark:function (mark) {
      var self = this, id = mark.attr('data-id'), dialog = self.remarkDialog;
      self._markElem = mark;
      if (!dialog) {
        dialog = Dialog.get('remark', {mask:true});
        var idx = mark.attr('data-idx'),
          data = self.data[idx];

        dialog.head('转发');

        // 加载remark dialog 逻辑
        require.async('./remark', function (Remark) {
          dialog.body(Mustache.to_html($('#remark_tpl').html(), data));
          dialog.center();
          Remark.init(dialog, self);

          // 更改数据
          $(dialog).bind('beforeShow', function (evt) {
            Remark.sync(self._markElem, self.data);
          });
          dialog.show();
        });

        return self.remarkDialog = dialog;
      }
      dialog.show();
    },

    /**
     * edit mark
     */
    edit:function (mark) {
      var self = this, id = mark.attr('data-id'), dialog = self.editDialog;
      self._markElem = mark;
      if (!dialog) {
        dialog = Dialog.get('editMark', {mask:true});

        dialog.head('编辑');
        dialog.body(Mustache.to_html($('#edit_mark_tpl').html(), self.data[mark.attr('data-idx')]));

        $(dialog).bind('beforeShow', function (evt) {
          // 临时处理 @TODO 事件订阅
          var el = self._markElem.find('.myboard'),
              data = self.data[self._markElem.attr('data-idx')];

          $(dialog.elem).find('a.btn_small > :first').html(data.board_name);
          $(dialog.elem).find('input.boardId').val(data.board_id);
          $(dialog.elem).find('textarea')
            .val(self._markElem.find('strong.title').text());
        });

        // 加载remark dialog 逻辑
        require.async('./remark', function (Remark) {
          // data是编辑后，返回的数据
          Remark.init(dialog, self, function (data) {
            self._markElem.find('strong.title').html(data.description);
            self._markElem.find('a.myboard')
              .attr('href', '/board/' + data.boardId).html(data.boardTitle);

            // resetPosition
            var col = self._markElem.attr('class').match(/col\-(\d)/);
            self._markElem.css('height', '');
            self.resetPosition(col[1]);
          });

          // 更改数据
          $(dialog).bind('beforeShow', function (evt) {
            Remark.sync(self._markElem, self.data);
          });
        });

        // 删除 event
        $(dialog.elem).find('a.del').click(function (evt) {
          evt.preventDefault();

          var txt = '', elem = evt.target,
            url = elem.href.replace(/^[^#]+/, '');
          url = url.replace('#!', '').replace(/(id=)(\d+)?/,
            '$1' + self._markElem.attr('data-id')
          );

          elem = $(elem);
          if (elem.html() === '删除ing') return;
          txt = elem.html();
          elem.html('删除ing');

          $.ajax({
            url:url,
            cache:false,
            success:function (result) {

              result = eval('(' + result + ')');
              if (true === result.success) {
                dialog.hide();
                self._markElem.animate({'opacity':0}, 'slow', function () {
                  var el = $(this), col = el.attr('class').match(/col\-(\d)/);
                  el.remove();
                  self.resetPosition(col[1]);
                });
              } else {
                alert(result.message);
              }
              elem.html(txt);
            },
            error:function () {
              alert('貌似服务器泡妞去了，要不你稍后试试～');
              elem.html(txt);
            }
          })
        });

        dialog.center();
        self.editDialog = dialog;
      }
      dialog.show();
    },

    /**
     * clear feed
     */
    clear:function (mark, elem) {
      var self = this, txt = '', url = elem.href.replace(/^[^#]+/, '');
      url = url.replace('#!', '');

      elem = $(elem);

      if ('正在清除..' === elem.text()) return;
      elem.text('正在清除..');

      $.ajax({
        url:url,
        cache:false,
        success:function (result) {
          elem.text(txt);
          result = eval('(' + result + ')');
          if (true === result.success) {
            $(elem).parents('.item').animate({'opacity':0}, 'slow', function () {
              var el = $(this), col = el.attr('class').match(/col\-(\d)/);
              el.remove();
              self.resetPosition(col[1]);
            });
          } else {
            alert(result.message);
          }
        }
      });
    },

    /**
     * like
     */
    like:function (mark, elem) {
      var self = this, url = elem.href.replace(/^[^#]+/, '');
      url = url.replace('#!', '');

      elem = $(elem);
      if (elem.attr('data-loading') == '1') return;

      $.ajax({
        url:url,
        cache:false,
        success:function (result) {

          result = eval('(' + result + ')');
          if (true === result.success) {
            elem.html(
              '<i class="i_like ' + (result.data.type ? 'i_liked' : '') +
                '"></i>' + (result.data.type ? '已喜欢' : '喜欢')
            );
          } else {
            alert('网络问题，请重试!');
          }

          elem.attr('data-loading', 0);
        },
        error:function () {
          alert('貌似服务器泡妞去了，要不你稍后试试～');
        }
      });
    },

    /**
     * new mark indicator
     */
    indicator:function () {
      var self = this, url = _g_config.new_mark_url,
        elem = $('<a href="#" id="indicator"><em>1</em>个新Mark</a>'),
        s = 5000, title = $('title'), new_marks = [];

      if (!url) return;
      elem.insertBefore('#canvas').click(function (evt) {
        evt.preventDefault();
        $(this).hide();

        self.timedChunk(new_marks, function (data) {
          self.create(data, true);
        }, self, function () {
          self.data = self.data.concat(new_marks);
          new_marks = []; // 清空
          self.resetPosition(true);// 强制重新渲染位置
          title.html(title.html().replace(/^(\(\d+\))/, ''));
        });
      });

      // 每5秒轮训一次，如果没有新数据，*2
      setTimeout(function () {
        var fn = arguments.callee;
        $.ajax({
          url:url,
          cache:false,
          success:function (result) {
            result = eval('(' + result + ')');
            if (false === result.success) return;
            var data = result.data;
            if (0 === data.length) {
              s = s >= 300000 ? s : s * 2;
            } else {
              new_marks = new_marks.concat(data);

              var text = title.html(),
                str = '(%s)'.replace('%s', new_marks.length);
              title.html(/^\(\d+\)/.test(text) ? text.replace(/^(\(\d+\))/, str) :
                str + text);

              elem.find('em').html(new_marks.length);
              elem.css({'display':'block', 'opacity':0})
                .animate({opacity:1}, 300);
              s = 5000;
            }
            setTimeout(fn, s);
          }
        });
      }, s);
    },

    init:function () {
      var self = this, timer = null;

      _.extend(self, Canvas);
      self.setup(function () {
        self.indicator(); // 开始轮训是否有最新mark
      });

      // 委托，处理画布里所有点击事件
      $('#content').click(function (evt) {
        var elem = evt.target;
        if (elem.tagName.toLowerCase() === 'i') {
          elem = elem.parentNode;
        }
        if (/#!/.test(elem.href)) {
          evt.preventDefault();
          var mark = $(elem).parents('.mark'),
            action = $(elem).attr('data-action');

          action && self[action](mark, elem);
        }
      });


    }
  });

  return this.MarkList;
});
