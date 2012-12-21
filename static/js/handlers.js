;(function(fragile, d3, moment, _){
  "use strict";
  // should be mostly self-documenting
  
  var issues = fragile.handlers.issues;
  
  issues.title = {
      gh_field: "title",
      description: "The title of the ticket"
  };
    
  issues.comment_stream = {
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
        .domain(config.collaborators);
        
      // call the async method, update whenevs
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
          
        var block = bin.selectAll("rect")
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
  };
  
  issues.devs_involved = {
    gh_field: "_comments",
    description: "A listing of commiters who have commented",
    handler: function(value, context, config){
      var td = d3.select(this);
      
      value(function(err, comments){
        var users = comments.reduce(function(result, cmnt){
          if(config.collaborators.indexOf(cmnt.user.login) !== -1){ 
            result[cmnt.user.login] = cmnt.user.avatar_url;
          }
          return result;
        }, {});
        
        var avatars = td.selectAll("img")
          .data(d3.entries(users));
          
        avatars.enter().append("img");
        
        avatars
          .attr("src", function(usr){
            return usr.value;
          })
          .attr("title", function(usr){
            return usr.key;
          })
          .attr("height", 16)
          .attr("width", 16);
          
        avatars.exit().remove();
      });
    }
  };
  
  issues.issue_number = {
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
  };
    
  issues.created_at = {
    gh_field: "created_at",
    label: "Created",
    description: "When the issue was created",
    handler: function(value, context){
      var span = d3.select(this).selectAll("span")
        .data([1]);
      
      span.enter().append("span").attr("class", "label");
        
      span.text(moment(value).fromNow());
    }
  };
    
  issues.updated_at = _(issues.created_at).chain().clone().extend({
    gh_field: "updated_at",
    label: "Updated",
    description: "When the issue was last updated"
  }).value();
  
}).call(this, fragile, d3, moment, _);