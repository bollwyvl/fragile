;(function(gh, $, _, url_args){
  var window = this;

  var fragile = window.fragile = function(){
    var my = {
        // configuration
        cfg: {},
        // stuff in url
        page_args: {},
        gh: null,
        user: null,
        issues: [],
        pull_requests: []
      },
      api = {};

    api.init = function(){
      api.patch()
        .load_config()
        //.auth() reenable this when a backend token broker is available
        .install_actions();
    };

    api.auth = function(){
      if(!my.page_args.code) return api;

      api.swap_code_for_token();
      return api;
    };

    api.load_config = function(){
      // extend config with fragile.json
      $.extend(my.cfg, $.parseJSON($.ajax({
        url: "./static/fragile.json",
        dataType: "json",
        async: false
      }).responseText) || {});

      my.page_args = url_args(window);
      return api;
    };

    api.patch = function(){
      // patch underscore with a mustache... hope nobody else needs this
      _.templateSettings = {
        interpolate : /\{\{(.+?)\}\}/g
      };
      return api;
    };

    api.swap_code_for_token = function(){
      var response = $.ajax({
        url: "https://github.com/login/oauth/access_token",
        type: "POST",
        crossDomain: true,
        dataType: "jsonp",
        data: {
          client_id: my.cfg.client_id,
          client_secret: "bb965ad1c4f0c6642429a41766b735c5a3146883",
          code: my.page_args.code,
          state: window.localStorage.state
        },
        success: function(){
          console.log(arguments);
        }
      });
      return api;
    };

    api.install_actions = function(){
      /*
        reenable this when a backend authenticator is available
        $(".loggedin.nope.action").on("click", api.login);
      */
      $("#login .btn-primary").on("click", api.login_basic);
      $(".loggedin.yep.action").on("click", api.logout);
      return api;
    };

    /*
    api.login_oauth = function(){
      window.localStorage.state = Math.random();

      var params = $.param({
        client_id: my.cfg.client_id,
        redirect_uri: window.location.href,
        state: window.localStorage.state
      });
      window.location = "https://github.com/login/oauth/authorize?" + params;
      // probably won't get here... maybe with a lovely pop-up
      return api;
    };
    */

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
      debugger;
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

fragile().init();

}).call(this, Github, $, _, url_args);