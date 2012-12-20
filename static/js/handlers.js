;(function(fragile, d3){
  fragile.handlers.issues = {
    title: {
      gh_field: "title",
      description: "The title of the ticket"
    },
    
    comment_stream: {
      gh_field: "_comments",
      description: "A visual depiction of the comment stream",
      handler: function(value, context, config){
        // candidate for extraction
        var chart = d3.select(this).selectAll("svg")
          .data([1]);
        
        chart.enter().append("svg")
          .attr("height", 20)
          .attr("width", 200);
          
        var scale = d3.time.scale()
          .domain([
            new Date(context.created_at),
            d3.time.day.offset(new Date(context.updated_at), 1)
          ])
          .range([200, 0]);
        
        var color = d3.scale.category20()
          .domain(config.users);
        
        value(function(err, comments){
          var hist = d3.layout.histogram()
            .bins(scale.ticks(10))
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
              .attr("width", 20)
              .attr("height", 5);
            
          block.attr("y", function(cmnt, idx){
              return idx * 5;
            })
            .style("fill", function(cmnt){
              if(color.domain().indexOf(cmnt.user.login) == -1) return "ddd";
              return color(cmnt.user.login);
            });
          
        });
      }
    },
    
    issue_number: {
      gh_field: "number",
      label: "#",
      description: "The project-specific issue number (the one GFM finds with #)",
      handler: function(value, context){
        var a = d3.select(this).selectAll("a")
          .data([1]);
        a.enter().append("a");
        a.attr("href", context.html_url)
          .attr("name", "issue_" + context.id)
          .attr("target", "_blank")
          .text(value);
      }
    }
  };
}).call(this, fragile, d3);