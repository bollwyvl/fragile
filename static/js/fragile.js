;(function(GH, $, _, d3){
  "use strict";
  // not planning on actually making this work on the server, but _ does it
  var window = this;
  
  // for jslint and firefox
  var console = window.console || {log: function(){}};

  // globally exposed, with shortcut
  var fragile = window.fragile = function(){
    // private configuration
    var my = {
        // externally populated config options, like `fragile.json`
        cfg: {},
        // the gh object
        gh: null,
        // shortcut to the current gh user
        user: null,
        // list of issue results from api
        issues: [],
        // list of pull requests from api
        pull_requests: [],
        // column view configurations
        columns: {issues: [], pulls: []}
      },
      // the publicly exposed api: see the bottom of the file. all members
      // should return this for chainiliciousness
      api = {};

    api.init = function(){
      // page just loaded, do some stuff... no data yet
      api.load_config()
        .init_ui()
        .install_actions();
    };
    
    api.init_ui = function(){
      // do more stuff based on config, i suppose
      $(".title.from_config").text(my.cfg.title);

      return api;
    };

    api.load_config = function(){
      // extend config with fragile.json
      try{
        $.extend(my.cfg, $.parseJSON($.ajax({
          url: "./static/fragile.json",
          dataType: "json",
          async: false
        }).responseText) || {});
      } catch(err) {
        console.log(err);
      }
      
      return api;
    };

    api.install_actions = function(){
      // user actions... could be made simpler
      $("#login .btn-primary").on("click", api.login_basic);
      $(".loggedin.yep.action").on("click", api.logout);
      $("#issues .refresh").on("click", api.update_issues_data);
      $("#issues .columns").on("click", api.update_columns("issues"));

      $("#pulls .refresh").on("click", api.pull_requests);
      $("#pulls .columns").on("click", api.update_columns("pulls"));
      
      $("#columns .btn-primary").on("click", api.update_issues_ui);
      return api;
    };
    

    api.login_basic = function(){
      // log in to github api with username and password
      var username = $("#username").val(),
        passwd = $("#password").val();

      // not that this will help much...
      $("#password").val();

      my.gh = new GH({
        username: username,
        password: passwd,
        auth: "basic"
      });

      // right now, just does issues... but should do more
      api.user(username, api.update_issues_data);

      return api;
    };

    api.logout = function(){
      // hopefully actuall gets everything out of scope... might not, 
      // as stuff might still be attached to the DOM
      my.gh = null;
      my.user = null;
      api.update_user_ui();
      
      return api;
    };

    api.user = function(username, callback){
      // set the user... this is asynchronous, hence the callback
      my.gh.getUser().show(username, function(err, user) {
        my.user = user;
        api.update_user_ui();
        callback();
      });
      
      return api;
    };
    
    api.update_user_ui = function(){
      // might be able to do this more elegantly with classes...
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
      // get some default columns... a getter/setter on my.columns.x might be 
      // better
      var col_names;
      if(parent === "issues"){
        col_names = ["issue_number", "title"];
      }
      return col_names.map(function(col_name){
        return api.make_column_config(col_name, parent);
      });
    };
    
    api.make_column_config = function(col_name, parent){
      // might should be an actual scoped object... also, initialization?
      return {
        col_name: col_name,
        col: fragile.handlers[parent][col_name]
      };
    };
    
    api.titlefy = function(slug){
      // turn this_name into This Name... should look into the crockford version
      return slug.split("_")
        .map(function(bit){
          return bit[0].toUpperCase() + bit.slice(1);
        }).join(" ");
    };
    
    api.update_issues_ui = function(){
      // update the issue table... will be refactored when adding PRs
      
      // get ye config
      var col_cfgs = my.columns.issues,
        default_cols = api.default_columns("issues");
      
      col_cfgs = col_cfgs.length ? col_cfgs : default_cols;
      
      // table header
      var head = d3.select("#issues thead tr")
        .selectAll("th").data(col_cfgs);
        
      head.enter().append("th");
      head.exit().remove();
      
      head.text(function(datum){
        return datum.col.label || api.titlefy(datum.col_name);
      });
      
      // update a row per ticket
      var row = d3.select("#issues tbody")
        .selectAll("tr").data(my.issues);
        
      row.enter().append("tr");
      row.exit().remove();
      
      // make a td per column configuration
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
      
      // css classes... not using these yet... might?
      col.enter().append("td")
        .attr("class", function(datum){return datum.cfg.col_name;});
      
      // call custom handlers, or just put in text from the ui
      col.each(function(cell){
        if(!cell.cfg.col.handler) return d3.select(this).text(cell.val);
        
        cell.cfg.col.handler.call(this, cell.val, cell.ctx, my.cfg);
      });

      return api;
    };
    
    
    api.update_columns = function(parent){
      // column update ui for issues and pull requests
      return function(){
        d3.select("#columns h3 span")
          .text(d3.select("#" + parent + " .brand").text());
        
        var enabled_idx = api.enabled_idx(parent);
        
        // ugly munging, but need to keep around a lot of stuff
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
        
        // row per column type (whoa, meta)
        var row = d3.select("#columns tbody")
          .selectAll("tr").data(hndlr_status);
          
        row.enter().append("tr");
        row.exit().remove();
        
        // cell per each of the column metas created above... kinda lame, as 
        // the list is known... who knows, might add a demo
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
        
        // do any fanciness...
        col.each(function(datum, idx){
          if(datum.key === "enabled"){
            api.column_checkbox.call(this, datum, parent);
          }else{
            d3.select(this).text(datum.value);
          }
        });
        
        return api;
      };
    };
    
        
    api.enabled_idx = function(parent){
      // generator for a callback that checks whether the given column
      // is configured in the dataset... probably not binary... should fix
      return function(col_name){
        // returns -1 if not found
        return _.pluck(my.columns[parent], "col_name").indexOf(col_name);
      };
    };
        
    
    api.column_checkbox = function(meta_col, parent){
      // creates a checkbox 
      var check = d3.select(this).selectAll("input")
        .data([1]);
              
      check.enter().append("input")
        .attr("type", "checkbox");
            
      check.property("checked", function(chk){
        return meta_col.value;
      });
            
      check.on("click", function(chk){
        var cfg = meta_col.cfg.cfg,
          idx = api.enabled_idx(parent)(cfg.col_name);
        if(idx === -1){
          my.columns[parent].push(cfg);
        }else{
          my.columns[parent].splice(idx, 1);
        }
      });
      
      return api;
    };
    
    
    api.update_issues_data = function(evt, callback){
      // asynchronously load the issue data... won't traverse any urls (e.g. 
      // comments)
      
      // counter for the different callbacks to update
      var repos_left = my.cfg.repos.length;
      
      // called by the asynchronous readers to decrement the repo count
      function repo_done(){
        repos_left--;
        if(repos_left) return;
        api.update_issues_ui();
        if(callback){
          callback();
        }
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

    // master api return to public users
    return api;
  };

// namespaced handler for datatypes... see handlers.js
fragile.handlers = {issues: {}, pulls: {}};

// fire it up
fragile().init();

// documents dependencies, etc. the call(this...) ensures we don't use any
// naked `window` or `document` references
}).call(this, Github, $, _, d3);
