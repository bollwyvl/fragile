;(function(fragile, d3){
  fragile.handlers.issues = {
    title: {
      name: "title",
      label: "Title"
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