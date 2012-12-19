# -*- coding: utf-8 -*-
import os
from os.path import join as opj
from os.path import abspath as opa

import sh

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
            static_url_path="",
            template_folder="./templates",
            static_folder=opa(opj(app_home, ".."))
            ),
        "prod": dict(
            static_url_path="/dist",
            template_folder="..",
            static_folder=opa(opj(app_home, "..", "dist"))
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

    Bootstrap(app)

    @app.route(url_root)
    def home():
        
        kwargs = {}
        
        return render_template("index.html", env=env, **kwargs)
        
    return app
    
if __name__ == "__main__":
    app = make_app()
    app.run()