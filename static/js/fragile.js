;(function(gh, $, _, d3){
  var window = this;

  var fragile = window.fragile = function(){
    var my = {
        // configuration
        cfg: {},
        gh: null,
        user: null,
        issues: [],
        pull_requests: []
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
      $("#pr .refresh").on("click", api.pull_requests);
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
    
    api.update_issues_ui = function(){
        
      // this need to be configurable
      
      var cols = [
        "title"
      ].map(function(x){return fragile.handlers.issues[x];});
      
      var head = d3.select("#issues thead tr")
        .selectAll("th").data(cols);
        
      head.enter().append("th");
      
      head.text(function(datum){
        return datum.label;
      });
      
      var row = d3.select("#issues tbody")
        .selectAll("tr").data(my.issues);
        
      row.enter().append("tr");
      row.exit().remove();
        
      var col = row.selectAll("td")
        .data(function(datum){
          return cols.map(function(col){
            return {col: col, val: datum[col.name], ctx: datum};
          });
        });
          
      col.enter().append("td")
        .attr("class", function(datum){return datum.col.name;});
          
      col.each(function(datum){
        if(!datum.col.handler) return d3.select(this).text(datum.val);
        
        datum.col.handler.call(this, datum.val, datum.ctx);
      });

      return api;
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