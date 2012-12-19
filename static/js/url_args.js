;(function(window){
  "use strict";
  function url_args(window){
    /*
    parse the ?<var>=<val>& string of the window's location into a dict 
    */
    return window.location.search.slice(1)
      .split("&")
      .reduce(function(res, bit){
        bit = bit.split("=");
        res[bit[0]] = bit[1];
      return res;
    }, {});
  }
  
  window.url_args = url_args;
})(this);