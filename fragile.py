# -*- coding: utf-8 -*-
import os
from os.path import join as opj
from os.path import abspath as opa

import mimetypes

mimetypes.add_type("application/font-woff", ".woff")

from flask import (
    Flask,
)
from flask import (
    render_template,
)

from flask.ext.bootstrap import Bootstrap

from flask.ext.assets import Environment
from webassets.filter.cssrewrite import CSSRewrite
from webassets.loaders import YAMLLoader


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

    bundles = YAMLLoader('assets.yaml').load_bundles()

    for to_fix in ["prod", "build"]:
        bundles["css-%s" % to_fix].filters.insert(0, fix_font_css)

    for name, bundle in bundles.iteritems():
        assets.register(name, bundle)

    @app.route(url_root)
    def index():
        kwargs = {}

        return render_template("index.html", env=env, **kwargs)

    return app

if __name__ == '__main__':
    # this is the production version: fabric handles others
    # Bind to PORT if defined, otherwise default to 5001.
    port = int(os.environ.get("PORT", 5001))
    make_app("prod").run(host="0.0.0.0", port=port)
