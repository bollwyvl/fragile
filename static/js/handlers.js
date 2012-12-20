;(function(fragile, d3){
  fragile.handlers.issues = {
    title: {
      name: "title",
      label: "Title"
    },
    
    _comments: {
      name: "_comments",
      label: "Comments",
      handler: function(value, context){
        var chart = d3.select(this).selectAll("svg")
          .data([1]);
        
        chart.enter().append("svg")
          .attr("height", 20)
          .attr("width", 200);
          
        var scale = d3.time.scale()
          .domain([
            new Date(context.created_at),
            d3.time.day.offset(new Date(), 1)
          ])
          .range([0, 200]);
        
        value(function(err, comments){
          var hist = d3.layout.histogram()
            .bins(20)
            .value(function(c){return d3.time.day(new Date(c.created_at));});
            
          var bin = chart.selectAll("g")
            .data(hist(comments));
            
          bin.enter().append("g");
          
          bin.attr("transform", function(datum){
            return "translate(" + scale(datum.x) + ",0)";
          });
          
          block = bin.selectAll("rect")
            .data(function(x){return x;});
            
          block.enter().append("rect")
              .attr("width", 2)
              .attr("height", 2);
            
          block.attr("y", function(datum, idx){
            return idx * 2;
          });
          
        });
      }
    },
    
    number: {
      name: "number",
      label: "#",
      handler: function(value, context){
        var a = d3.select(this).selectAll("a")
          .data([1]);
        a.enter().append("a");
        a.attr("href", context.html_url)
          .attr("name", "issue_"+context.id)
          .attr("target", "_blank")
          .text(value);
      }
    }
  };
}).call(this, fragile, d3);