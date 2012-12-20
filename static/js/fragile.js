;(function(gh, $, _, d3){
  var window = this;

  var fragile = window.fragile = function(){
    var my = {
        // configuration
        cfg: {},
        gh: null,
        user: null,
        issues: [],
        pull_requests: [],
        columns: {issues: [], pulls: []}
      },
      api = {};

    api.init = function(){
      api.load_config()
        .init_ui()
        .install_actions();
    };
    
    api.init_ui = function(){
      $(".title.from_config").text(my.cfg.title);

      return api;
    };

    api.load_config = function(){
      // extend config with fragile.json
      $.extend(my.cfg, $.parseJSON($.ajax({
        url: "./static/fragile.json",
        dataType: "json",
        async: false
      }).responseText) || {});
      
      return api;
    };

    api.install_actions = function(){
      $("#login .btn-primary").on("click", api.login_basic);
      $(".loggedin.yep.action").on("click", api.logout);
      $("#issues .refresh").on("click", api.issues);
      $("#issues .columns").on("click", api.update_columns("issues"));

      $("#pulls .refresh").on("click", api.pull_requests);
      $("#pulls .columns").on("click", api.update_columns("pulls"));
      
      $("#columns .btn-primary").on("click", api.update_issues_ui);
      return api;
    };
    

    api.login_basic = function(){
      var username = $("#username").val(),
        passwd = $("#password").val();

      // not that this will help much...
      $("#password").val(Math.random());

      my.gh = new Github({
        username: username,
        password: passwd,
        auth: "basic"
      });

      api.user(username, api.issues);

      return api;
    };

    api.logout = function(){
      my.gh = null;
      my.user = null;
      api.update_user_ui();
      
      return api;
    };

    api.user = function(username, cb){
      my.gh.getUser().show(username, function(err, user) {
        my.user = user;
        api.update_user_ui();
        cb();
      });
      
      return api;
    };
    
    api.update_user_ui = function(){
      if(my.user){
        $(".username.me").text(my.user.login);
        $(".avatar.me").attr("src", my.user.avatar_url);
        $(".loggedin.yep").show();
        $(".loggedin.nope").hide();
      }else{
        $(".loggedin.yep").hide();
        $(".loggedin.nope").show();
      }
      
      return api;
    };
    
    api.default_columns = function(parent){
      var col_names;
      if(parent === "issues"){
        col_names = ["issue_number", "title"];
      }
      return col_names.map(function(col_name){
        return api.make_column_config(col_name, parent);
      });
    };
    
    api.make_column_config = function(col_name, parent){
      return {
        col_name: col_name,
        col: fragile.handlers[parent][col_name]
      };
    };
    
    api.titlefy = function(slug){
      return slug.split("_")
        .map(function(bit){
          return bit[0].toUpperCase() + bit.slice(1);
        }).join(" ");
    };
    
    api.update_issues_ui = function(){
        
      var col_cfgs = my.columns.issues,
        default_cols = api.default_columns("issues");
      
      col_cfgs = col_cfgs.length ? col_cfgs : default_cols;
      
      var head = d3.select("#issues thead tr")
        .selectAll("th").data(col_cfgs);
        
      head.enter().append("th");
      head.exit().remove();
      
      head.text(function(datum){
        return datum.col.label || api.titlefy(datum.col_name);
      });
      
      var row = d3.select("#issues tbody")
        .selectAll("tr").data(my.issues);
        
      row.enter().append("tr");
      row.exit().remove();
        
      var col = row.selectAll("td")
        .data(function(datum){
          return col_cfgs.map(function(col_cfg, idx){
            return {
              cfg: col_cfg,
              val: datum[col_cfg.col.gh_field], // really needed? sensible def
              ctx: datum
            };
          });
        }, function(row_col, idx){
          return row_col.cfg.col_name + "_" +idx;
        });
      
      col.exit().remove();
      
      col.enter().append("td")
        .attr("class", function(datum){return datum.cfg.col_name;});
          
      col.each(function(cell){
        if(!cell.cfg.col.handler) return d3.select(this).text(cell.val);
        
        cell.cfg.col.handler.call(this, cell.val, cell.ctx, my.cfg);
      });

      return api;
    };
    
    
    api.update_columns = function(parent){
      return function(){
        d3.select("#columns h3 span")
          .text(d3.select("#" + parent + " .brand").text());
        
        var enabled_idx = function(col_name){
          // returns -1 if not found
          return _.pluck(my.columns[parent], "col_name").indexOf(col_name);
        };
        
        var hndlr_status = _.map(
          fragile.handlers[parent],
          function(col, name){
            return {
              enabled: enabled_idx(name) !== -1,
              label: col.label || api.titlefy(name),
              desc: col.description,
              cfg: api.make_column_config(name, parent)
            };
        });
        
        var row = d3.select("#columns tbody")
          .selectAll("tr").data(hndlr_status);
          
        row.enter().append("tr");
        row.exit().remove();
        
        var col = row.selectAll("td")
          .data(function(cfg){
            return d3.entries(cfg)
              .filter(function(x){return x.key !== "cfg";})
              .map(function(datum){
                datum.cfg = cfg;
                return datum;
              });
          });
        
        col.enter().append("td");
        
        col.each(function(datum, idx){
          if(datum.key === "enabled"){
            var check = d3.select(this).selectAll("input")
              .data([1]);
              
            check.enter().append("input")
              .attr("type", "checkbox");
            
            check.property("checked", function(chk){
              return datum.value;
            });
            
            check.on("click", function(chk){
              var cfg = datum.cfg.cfg,
                idx = enabled_idx(cfg.col_name);
              if(idx === -1){
                my.columns.issues.push(cfg);
              }else{
                my.columns.issues.splice(idx, 1);
              }
            });
          }else{
            d3.select(this).text(datum.value);
          }
        });
        
        return api;
      };
    };
    
    
    api.issues = function(){
      var repos_left = my.cfg.repos.length;
      
      // called by the asynchronous readers
      function repo_done(){
        repos_left--;
        if(repos_left) return;
        api.update_issues_ui();
      }
      
      my.cfg.repos.map(function(owner_repo){
        owner_repo = owner_repo.split("/");
        my.gh.getIssues(owner_repo[0], owner_repo[1])
          .list(function(err, issues){
            var urls = _.pluck(my.issues, "url");
            
            issues.map(function(issue){
              var issue_idx = urls.indexOf(issue.url);
              
              if(issue_idx === -1){
                my.issues.push(issue);
              }else{
                my.issues[issue_idx] = issue;
              }
            });
            
            repo_done();
          });
      });
      
      return api;
    };

    return api;
  };

fragile.handlers = {};

fragile().init();

}).call(this, Github, $, _, d3);
