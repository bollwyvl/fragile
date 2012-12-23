# -*- coding: utf-8 -*-
import os
from os.path import join as opj
from os.path import abspath as opa

from flask import (
    Flask,
    )
from flask import (
    render_template,
    )
from flask.ext.bootstrap import Bootstrap

def make_app(env="dev"):
    
    DEBUG = True #= env == "dev"
    
    url_root = {
        "dev": "/",
        "prod": "/dist/",
        "test": "/dist/"
    }[env]
    
    app_home = os.path.dirname(__file__)
    
    cfg = {
        "dev": dict(
            static_url_path="/static",
            template_folder="./templates",
            static_folder=opa(opj(app_home, "static"))
            ),
        "prod": dict(
            static_url_path="/dist",
            template_folder="./templates",
            static_folder=opa(opj(app_home, "dist"))
            ),
        "test": dict(
            static_url_path="/dist",
            template_folder="../dist",
            static_folder=opa(opj(app_home, "..", "dist"))
            )
    }[env]
    
    app = Flask(__name__, **cfg)
    app.config['CSRF_ENABLED'] = DEBUG
    app.config['SECRET_KEY'] = "totally-insecure"
    app.config['DEBUG'] = DEBUG
    app.config['BOOTSTRAP_JQUERY_VERSION'] = None

    Bootstrap(app)

    @app.route(url_root)
    def home():
        svg = "\n".join(open("static/svg/landing.svg","r")
            .readlines()[2:]
          ).replace('id="svg2"', 'id="landing_svg"')
        kwargs = {
          "landing_svg": svg
        }
        
        if env != "test":
            kwargs.update(assets())
        
        return render_template("index.html", env=env, **kwargs)
        
    return app

def assets(for_file="."):
    result = dict(scripts=[], styles=[])
    for a_type in result.keys():
        a_list = opj(
            os.path.dirname(__file__),
            for_file,
            a_type + ".txt")
        if os.path.exists(a_list):
            result[a_type] = [
                asset.strip()
                for asset
                in open(a_list).read().split("\n")
                if asset.strip() and not asset.strip().startswith("#")
            ]
    
    return result

if __name__ == "__main__":
    app = make_app()
    app.run()