;(function(fragile, d3, _, $){
  "use strict";
  
  var window = this,
    console = window.console || {log: function(){}};
  
  // should be mostly self-documenting
  var lander = function(config_callback){
    var cfg = config_callback,
      api = {};

  
    api.load_landing = function(callback){
      var landing = cfg();
      
      // the absolute minimum right now... does enable the `basic` usage model
      if(landing === null || landing === undefined){
        landing = "static/svg/landing";
      }
      
      if(_.isString(landing)){
          d3.xml(landing + ".svg", "image/svg+xml", function(xml) {
              var importedNode = window.document.importNode(
                xml.documentElement, true);
              d3.select("#landing").node().appendChild(importedNode);
              callback();
          });
      }else if(_.isObject(landing)){
        console.log("not implemented");
        return;
      }else if(_.isArray(landing)){
        console.log("not implemented");
        return;
      }
    };
    
    api.play_landing = function(){
      // this is the basic case... TODO: refactor
      var win = $(window),
        svg = d3.select("#landing svg"),
        layers = svg.select("#landing svg > g"),
        rx = Math.min(
          $(window).height() / svg.attr("height"),
          $(window).width() / svg.attr("width")
        ) * 0.8,
        wpx = (rx * svg.attr("width") + 5)+"px",
        hpx = (rx * svg.attr("height") + 5)+"px",
        layer_order = api.layer_order();
        
      svg.attr("width", wpx)
        .attr("height", hpx);
      
        // clean up layer 1
      layers.attr("transform", function(){
        return "scale("+ rx +") " + d3.select(this).attr("transform");
      });
      
      d3.select("#landing")
        .style("width", wpx)
        .style("opacity", 0.0)
        .style("visibility", "visible")
      .transition()
        .style("opacity", 1.0);
    };
    /*
    TODO: bring this back 
    .transition()
      .each(function(datum, idx){
        // TODO: it's gotta work better
        if(idx){return;}
        layers.transition()
          .delay(function(d, i){
            var ink_label = this.attributes["inkscape:label"].value,
              build_order = layer_order.indexOf(ink_label);
            return build_order * 1000;
          })
          .style("opacity", 100);
      });
        
    layers.style("opacity", 0);
    
    .transition()
      .style("opacity", 100)
    .transition()
      .each(function(datum, idx){
        // TODO: it's gotta work better
        if(idx){return;}
        layers.transition()
          .delay(function(d, i){
            var ink_label = this.attributes["inkscape:label"].value,
              build_order = layer_order.indexOf(ink_label);
            return build_order * 1000;
          })
          .style("opacity", 100);
      });
        
    layers.style("opacity", 0);
    */
    
    api.inkscape_layers = function(){
      // do better!
      var prefix = "layer",
        layers = d3.selectAll("g")
          .filter(function(){
            return d3.select(this).attr("id").slice(0,prefix.length) === prefix;
          });
      
      layers = layers.data(d3.range(layers[0].length))
        .filter(function(){return this;});
        return layers;
    };
    
    api.layer_order = function(){
      var layer_names = [];
      
      api.inkscape_layers().each(function(){
        layer_names.push(this.attributes["inkscape:label"].value);
      });
      layer_names.sort();
      return layer_names;
    };
    
    api.show = function(callback){
      // TODO: do something with this callback
      api.load_landing(api.play_landing);
      return api; 
    };
  
    return api;
  };
  
  fragile.lander(lander);
}).call(this, fragile, d3, _, $);