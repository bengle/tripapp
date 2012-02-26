(function() {

  // IE6 跳转
  if (!+'\v1' && !('maxHeight' in document.body.style)) {
      window['FXL_IE6'] = 1;
      //if (window.location.hash !== '#ie6') return window.location.href = '/not-supported.html';
  } else {
      window['FXL_IE6'] = 0;
  }

  var alias = {
  'es5-safe': 'es5-safe/0.9.2/es5-safe',
  'json': 'json/1.0.1/json',

  'jquery': 'jquery/1.6.4/jquery',
  'mustache': 'mustache/0.4.0/mustache',
  'querystring': 'querystring/1.0.1/querystring',
  'underscore': 'underscore/1.2.1/underscore',

  'imgareaselect': 'imgareaselect/0.9.6/imgareaselect',
  'imgareaselect-css': 'imgareaselect/0.9.6/css/imgareaselect-default.css',

  'jquery-validate': 'jquery-validate/1.8.1/jquery-validate',
  'jquery-validate-messages': 'jquery-validate/1.8.1/messages_cn.js',

  //'jquery.ui.core': 'jquery.ui/1.8.16/jquery.ui.core',
  //'jquery.ui.widget': 'jquery.ui/1.8.16/jquery.ui.widget',
  //'jquery.ui.position': 'jquery.ui/1.8.16/jquery.ui.position',

  // jquery.ui.core + jquery.ui.widget + jquery.ui.position
  'jquery.ui': 'jquery.ui/1.8.16/jquery.ui.js',
  'jquery.ui.tabs': 'jquery.ui/1.8.16/jquery.ui.tabs.js',
  'jquery.ui.autocomplete': 'jquery.ui/1.8.16/jquery.ui.autocomplete.js',

  'jquery.easing': 'jquery.easing/1.3/jquery.easing.js',
  'jquery.fancybox': 'jquery.fancybox/1.3.4/jquery.fancybox.js',

  'dialog': 'dialog/0.0.3/dialog',
  'ajaxupload': 'ajaxupload/1.0.0/ajaxupload',
  'zeroclipboard': 'zeroclipboard/1.0.7/zeroclipboard'
  };

  var map = [
    [/^(.*\/js\/.*?)([^\/]*\.js)$/i, '$1__build/$2?t=20120225']
  ];


  if (seajs.debug) {
    for (var k in alias) {
      if (alias.hasOwnProperty(k)) {
        var p = alias[k];
        if (!/\.(?:css|js)$/.test(p)) {
        alias[k] += '-debug';
        }
      }
    }
    map = [];
  }

  seajs.config({
    alias: alias,
    preload: [
      Function.prototype.bind ? '' : 'es5-safe',
      this.JSON ? '' : 'json'
    ],
    map: map,
    base: 'http://assets.faxianla.com/libs/'
  });

})();


define(function(require, exports) {

  exports.load = function(filename) {
    filename.split(',').forEach(function(modName) {
      require.async('./' + modName, function(mod) {
        if (mod && mod.init) {
          mod.init();
        }
      });
    });
  };

  require.async('./head');
  require.async('./ga');

    if (window['FXL_IE6'])  require.async('./ie6');
});
