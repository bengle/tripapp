/**
 * GA module for markzhi.com
 */

define(function(require, exports) {

  var global = this;

  // 调试或者开发环境，不发送ga
  if ( document.domain.indexOf('markzhi.net') !== -1 || (seajs._data && seajs._data.config.debug) ) return;
  //exports.init = function() {
    var _gaq = [];
    _gaq.push(['_setAccount', 'UA-28104561-1']);
    _gaq.push(['_trackPageview']);
    global._gaq = _gaq;

    var src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    require.async(src);
  //};

});
