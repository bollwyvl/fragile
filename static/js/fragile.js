;(function(GH, $, _, d3){
  "use strict";
  
  
  
  // not planning on actually making this work on the server, but _ does it
  var window = this,
    phi = (1 + Math.sqrt(5) ) / 2;
  
  // for jslint and firefox
  var console = window.console || {log: function(){}};

  // library variables
  var lib = {handlers: {}};

  // globally exposed, with shortcut
  var fragile = window.fragile = function(static_path){
    static_path = static_path.length ? static_path : "./";
    // private configuration
    var my = {
        // externally populated config options, like `fragile.json`
        cfg: {
          title: "",
          repos: [],
          collaborators: [],
          handlers: null,
          landing: null
        },
        // the gh object
        gh: null,
        // shortcut to the current gh user
        user: null,
        // list of issue results from api
        issues: [],
        // list of pull requests from api
        pulls: [],
        // list of repo trees
        repos: {},
        // column view configurations
        columns: {issues: [], pulls: []},
        // move this later
        layer_order: []
      },
      // the publicly exposed api: see the bottom of the file. all members
      // should return this for chainiliciousness
      api = {};

      // handlers, right now for grid... TODO: refactor like lander
      my.handlers = lib.handlers;
      my.lander = lib.lander(
        function(attr){return my.cfg.landing;},
         static_path);

    api.init = function(){
      // page just loaded, do some stuff... no data yet
      api.load_config()
        .init_ui()
        .install_actions();
      
      return api;
    };
    
    api.init_ui = function(){
      // do more stuff based on config, i suppose... might not be much loaded
      $(".title.from_config").text(my.cfg.title);
      $("title").text(my.cfg.title);
      
      my.lander.show();
      
      return api;
    };

    api.load_config = function(){
      // do the best guess of the config
      var loc = window.location,
        static_loc = static_path + "fragile.json";
      
      if(loc.hostname.indexOf("github.com") !== -1){
        var owner = loc.hostname.replace(".github.com", ""),
          repo = loc.pathname.split("/")[1];
        my.cfg.repos = [owner + "/" + repo];
      }else if(loc.search.length){
        // allow single hosted instance?
        static_loc = static_path + loc.search.slice(2);
        if(static_loc.slice(-1) === "/"){
          static_loc = static_loc.slice(0, static_loc.length-1)
        }
        static_loc = static_loc + ".json";
      }
      
      // extend config with fragile.json
      var json = $.ajax({
        url: static_loc,
        dataType: "json",
        async: false,
        error: function(){
          console.info("Hi, there! It's no big deal if you don't have a " +
           "fragile.json! It's just for fancy configuration stuff that can't " +
           "be figured out from where you host it (like localhost!). Here's " +
           "your config right now",
           my.cfg);
        }
      });
      
      if(json.status !== 404){
        try{
          var json_cfg = $.parseJSON(json.responseText); 
          $.extend(my.cfg, json_cfg || {});
        } catch(err) {
          console.log("Something was wrong with fragile.json\n",
            err.stack);
        }
      }
      
      return api;
    };

    api.install_actions = function(){
      // user actions... could be made simpler
      $("#login .btn-primary").on("click", api.login_basic);
      $(".loggedin.yep.action").on("click", api.logout);
      $("#issues .refresh").on("click", api.update_issues_data);
      $("#issues .columns").on("click", api.update_columns("issues"));

      $("#pulls .refresh").on("click", api.update_pulls_data);
      $("#pulls .columns").on("click", api.update_columns("pulls"));
      

      $("#repos .refresh").on("click", api.update_repos_data);
      
      $("#columns .btn-primary").on("click", function(){
        api.update_issues_ui().update_pulls_ui();
      });
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
      
      d3.select("#landing")
        .transition()
          .style("opacity", 0)
          .style("display", "none");
      
      d3.select("#app")
          .style("opacity", 0)
          .style("display", "block")
      .transition()
        .style("opacity", 100);

      // right now, just does issues... but should do more
      api.user(username, api.gh_api_available);

      return api;
    };
    
    api.gh_api_available = function(){
      // hooray, we have data. let's get busy
      
      var data_calls = function(){
        api.update_repos_data();
        api.update_issues_data();
        api.update_pulls_data();
      };
      
      if(!my.cfg.collaborators.length){
        // check this out before getting users... might need it for rendering
        // eventually this will update my.cfg.collaborators
        api.update_collaborators_data(null, data_calls);
      }else{
        data_calls();
      }
      
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
    
    api.default_columns = function(thing_type){
      // get some default columns... a getter/setter on my.columns.x might be 
      // better
      var col_names = {
        issues: ["issue_number", "title"],
        pulls: ["pull_number", "title"]
      }[thing_type];
      
      return col_names.map(function(col_name){
        return api.make_column_config(col_name, thing_type);
      });
    };
    
    api.make_column_config = function(col_name, parent){
      // might should be an actual scoped object... also, initialization?
      return {
        col_name: col_name,
        col: my.handlers[parent][col_name]
      };
    };
    
    api.titlefy = function(slug){
      // turn this_name into This Name... should look into the crockford version
      return slug.split("_")
        .map(function(bit){
          return bit[0].toUpperCase() + bit.slice(1);
        }).join(" ");
    };
    
    api.update_grid = function(thing_type){
      return function(evt, callback){
        // update the issue table... will be refactored when adding PRs
      
        // get ye config
        var col_cfgs = my.columns[thing_type],
          default_cols = api.default_columns(thing_type),
          thing_grid = d3.select("#" + thing_type);
      
        col_cfgs = col_cfgs.length ? col_cfgs : default_cols;
      
        // table header
        var head = thing_grid.select("thead tr")
          .selectAll("th").data(col_cfgs);
        
        head.enter().append("th");
        head.exit().remove();
      
        head.text(function(datum){
          return datum.col.label || api.titlefy(datum.col_name);
        });
      
        // update a row per ticket/pull
        var row = thing_grid.select("tbody")
          .selectAll("tr").data(my[thing_type]);
        
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
          if(!cell.cfg.col.handler){return d3.select(this).text(cell.val);}
        
          cell.cfg.col.handler.call(this, cell.val, cell.ctx, my.cfg);
        });

        return api;
      };
    };
    
    api.update_issues_ui = api.update_grid("issues");
    api.update_pulls_ui = api.update_grid("pulls");
    

    /*
    {
      "type": "tree",
      "path": "IPython",
      "sha": "bb21dfced8a84fff719ce1caeb427148e5180bd5",
      "mode": "040000",
      "url": ...
    },
    {
      "type": "blob",
      "path": "IPython/__init__.py",
      "sha": "fa3eb25688a23110f7d9a539a66d104b3c68689a",
      "mode": "100644",
      "url": ...,
      "size": 3214
    },
    */
    
    api.file_list_to_treemap = function(file_list){
      // whips up a d3 "canonical" data structure... failed with other approach
      // also, we're going to use a map with side-effects (shudder)
      // this has the pleasant benefit of leaving the in-place tree list for 
      // others to use... though keeping this someplace may be beneficial...
      
      function tree_struct(orig){
        return {orig: orig, children: {}};
      }
      
      //up, gonna use a special value
      var root = tree_struct({type: "tree", path: "."});
      
      file_list.map(function(path_or_file){
        var parent = root,
          bits = path_or_file.path.split("/"),
          last_bit = bits.slice(-1);
        
        // hooray, more side effects!  
        bits.slice(0, -1).map(function(bit){
          parent = parent.children[bit];
        });
        
        parent.children[last_bit] = tree_struct(path_or_file);
      });
      // d3 likes lists
      return [root];
    };
    
    api.update_repos_ui = function(){
      var width = ($(".trees").width() / d3.keys(my.repos).length) - 15,
          height = 300;
      
      var children = function(path_or_file){
        if(path_or_file.type === "blob"){return [];}
        
        return d3.values(path_or_file.children);
      };
      
      var sort = function(a, b){
        // would like paths first, then files... might be reversed
        if(a.orig.type !== b.orig.type){
          return a.orig.type.localeCompare(b.orig.type);
        }   
        return a.orig.path.localeCompare(b.orig.path);
      };
        
      var value = function(file_or_path){
        return file_or_path.orig.size;
      };
        

      _.map(my.repos, function(file_list, repo_name){
        
        // magic root... underlying data item is changed
        var root = [{path: "", type: "tree"}];
        
        var treemap = d3.layout.treemap()
          .size([width-1, height-1])
          .children(children)
          .sort(sort)
          .value(value);
          
        var svg = d3.select(".trees").append("svg")
          .attr("width", width)
          .attr("height", height)
        .append("g")
          .attr("transform", "translate(.5,.5)"); // weird pixel thing 
          
        var cell = svg.data(api.file_list_to_treemap(file_list))
          .selectAll("g").data(treemap.nodes)
          .enter().append("g")
            .attr("class", "cell")
            .attr("transform", function(d){
              return "translate(" + d.x + "," + d.y + ")";
            });

        cell.append("rect")
          .attr("width", function(d){ return d.dx; })
          .attr("height", function(d){ return d.dy; })
          .on("mouseover", function(file){
            d3.select("#repos .file_path").text(file.orig.path);
          })
          .on("click", function(file){
            
          });

        cell.append("text")
          .attr("x", function(d) { return d.dx / 2; })
          .attr("y", function(d) { return d.dy / 2; })
          .attr("dy", ".35em")
          .attr("text-anchor", "middle")
          
          .text(function(d) { return d.children ? null : d.name; });
          
      });
    };
    
    
    api.update_columns = function(parent){
      // column update ui for issues and pull requests
      return function(){
        d3.select("#columns h3 span")
          .text(d3.select("#" + parent + " .brand").text());
        
        var enabled_idx = api.enabled_idx(parent);
        
        // ugly munging, but need to keep around a lot of stuff
        var hndlr_status = _.map(
          my.handlers[parent],
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
    
    /*
    DATA STUFF
    */
    
    
    api.repo_countdown_to = function(callsback){
      // counter for the different callbacks to update
      var repos_left = my.cfg.repos.length;
      
      // called by the asynchronous readers to decrement the repo count
      function repo_done(){
        repos_left--;
        
        if(repos_left){return;}
        
        callsback.filter(_.isFunction).map(function(x){x();});
      }
      
      return repo_done;
    };
    
    var _update_data_list = function(thing_type, base_callback){
      return function(evt, callback){
        var repo_done = api.repo_countdown_to([base_callback, callback]);
      
        my.cfg.repos.map(function(owner_repo){
          var repo = my.gh.getRepo.apply(null, owner_repo.split("/"));
        
          var my_things = my[thing_type];
        
          repo[thing_type](function(err, things) {
            if(err){
              console.error(err);
            }else{
              var urls = _.pluck(my[thing_type], "url");
            
              things.map(function(thing){
                var thing_idx = urls.indexOf(thing.url);
              
                if(thing_idx === -1){
                  my_things.push(thing);
                }else{
                  my_things[thing_idx] = thing;
                }
              });
            }
            repo_done();
          });
        });
      
        return api;
      };
    };
    
    api.update_issues_data = _update_data_list("issues", api.update_issues_ui);
    
    api.update_pulls_data = _update_data_list("pulls", api.update_pulls_ui);
    
    
    api.update_collaborators_data = function(evt, callback){
      // TODO: refactor this...
      var repo_done = api.repo_countdown_to([callback]);
      
      my.cfg.repos.map(function(owner_repo){
        var repo = my.gh.getRepo.apply(null, owner_repo.split("/"));
        
        repo.collaborators(function(err, collaborators) {
          if(err){
            console.error(err);
          }else{
            my.cfg.collaborators.push.apply(
              my.cfg.collaborators,
              _.pluck(collaborators, "login")
            );
          }
          repo_done();
        });
      });
    };
    
    api.update_repos_data = function(evt, callback){
      // pull down a tree of the repos' files suitable for display in a treemap
      
      var repo_done = api.repo_countdown_to([api.update_repos_ui, callback]);
      
      my.cfg.repos.map(function(owner_repo){
        var repo = my.gh.getRepo.apply(null, owner_repo.split("/"));
        
        repo.getTree('master?recursive=true', function(err, tree) {
          if(err){
            console.error(err);
          }else{
            my.repos[owner_repo] = tree;
          }
          repo_done();
        });
      });
    };
    

    // master api return to public users
    return api;
  };

fragile.handlers = function(handlers){
  if(!arguments.length){return _.clone(lib.handlers);}
  _.map(handlers, function(type_hndlrs, hndlr_type){
    if(!_.isObject(lib.handlers[hndlr_type])){
      lib.handlers[hndlr_type] = {};
    }
    _.extend(lib.handlers[hndlr_type], type_hndlrs);
  });
  
};
    
fragile.lander = function(lander){
  if(!arguments.length){return _.clone(lib.lander);}
  
  lib.lander = lander;
};
// documents dependencies, etc. the call(this...) ensures we don't use any
// naked `window` or `document` references
}).call(this, Github, $, _, d3);
