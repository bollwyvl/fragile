# -*- coding: utf-8 -*-
import os
import sys
from os.path import join as opj
from os.path import abspath as opa

import urlparse

# correct path for local_config import
sys.path += [".."]
try:
    import local_config
except ImportError:
    print("Couldn't find local_config.py")

import mimetypes

# for the webfonts... might change...
mimetypes.add_type("application/x-font-woff", ".woff")

from flask import (
    Flask,
    render_template,
    request,
)

from flask.ext.bootstrap import Bootstrap

from flask.ext.assets import Environment
from webassets.filter.cssrewrite import CSSRewrite
from webassets.loaders import YAMLLoader

import requests

def make_app(env="dev"):
    """
    This is still needlessly complicated.

    Returns a Flask WSGI instance.
    """
    debug = env == "dev"

    url_root = dict(
        dev="/",
        build="/dist/",
        test="/dist/",
        prod="/"
    )[env]

    app_home = os.path.dirname(__file__)

    cfg = dict(
        dev=dict(
            static_url_path="/static",
            template_folder="./templates",
            static_folder=opa(opj(app_home, "static"))
        ),
        build=dict(
            static_url_path="/",
            template_folder="./templates",
            static_folder=opa(opj(app_home, "static"))
        ),
        test=dict(
            static_url_path="/dist",
            template_folder="../dist",
            static_folder=opa(opj(app_home, "..", "dist"))
        ),
        prod=dict(
            static_url_path="/static",
            template_folder="./templates",
            static_folder=opa(opj(app_home, "static"))
        )
    )[env]

    app = Flask(__name__, **cfg)

    app.config.update(dict(
        CSRF_ENABLED=debug,
        SECRET_KEY=os.environ.get("FLASK_SECRET_KEY", "totally-insecure"),
        DEBUG=debug,
        ASSETS_DEBUG=debug,
        BOOTSTRAP_JQUERY_VERSION=None
    ))

    Bootstrap(app)

    def font_stuff(url):
        """
        Some font URL rewriting
        """
        repl = "./lib/awesome/font/"
        if env == "build":
            repl = "./font/"
        return url.replace("../font/", repl)

    fix_font_css = CSSRewrite(replace=font_stuff)

    assets = Environment(app)

    bundles = YAMLLoader(os.path.join(app_home, 'assets.yaml')).load_bundles()

    for to_fix in ["prod", "build"]:
        bundles["css-%s" % to_fix].filters.insert(0, fix_font_css)

    for name, bundle in bundles.iteritems():
        assets.register(name, bundle)


    @app.route(url_root)
    def index():
        kwargs = {
            "gh_client_id": os.environ.get("GITHUB_CLIENT_ID", 
                "deadbeef")
        }

        return render_template("index.html", env=env, **kwargs)


    @app.route("/login")
    def login(code=None):
        return render_template("login.html")


    @app.route("/oauth")
    def oauth():
        oauth_args = dict(
            code=request.args.get("code", ""),
            state=request.args.get("state", ""),
            client_id=os.environ["GITHUB_CLIENT_ID"],
            client_secret=os.environ["GITHUB_CLIENT_SECRET"]
        )
        
        req = requests.post(
            "https://github.com/login/oauth/access_token",
            data=oauth_args
        )
        
        query = urlparse.parse_qs(req.content)
        
        return query["access_token"][0]

    return app

if __name__ == '__main__':
    # this is the production version: fabric handles others
    # Bind to PORT if defined, otherwise default to 5000.
    PORT = int(os.environ.get("PORT", 5000))
    make_app("prod").run(host="0.0.0.0", port=PORT)
