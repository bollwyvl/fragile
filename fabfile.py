#!/usr/bin/env python
"""
fabric tasks for repetitive fragile tasks
"""

import os
import sys

from fabric.api import task

import sh

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from fragile import make_app

PROJECT_ROOT = str(sh.git("rev-parse", **{"show-toplevel": True})).strip()
PROJECT_SHA = str(sh.git("rev-parse", "HEAD")).strip()


@task
def proj():
    """switch to the project directory... still doesn't work in sobmodules"""
    sh.cd(PROJECT_ROOT)


@task
def flake():
    """run some flakes"""
    print(". running PyFlakes on test equipment")
    proj()
    sh.pyflakes("setup.py", "fabfile.py", "fragile.py")


@task
def pep8():
    """check python style"""
    sh.pep8("fabfile.py", "fragile.py")


@task
def build():
    """do the build for static files hosting... mostly webassets now"""
    proj()
    flake()
    clean()
    favicon()
    html()
    copy_assets()
    patch_css()
    dirty()
    sh.cd("dist")
    sh.git("add", ".")
    print sh.git("status")


@task
def dev():
    """set up repository for development"""
    proj()
    sh.git("submodule", "init")
    sh.git("submodule", "update")


@task
def clean():
    """clean up generated files"""
    proj()
    print ". cleaning up build and dist"
    try:
        sh.rm("-r",
            sh.glob("dist/*"),
            sh.glob("build/*")
        )
    except Exception, err:
        print ".. already clean: %s" % err


@task
def dirty():
    """list of uncommited changes, as this is hard to get out of submodules"""
    proj()
    dirty_file = open(".dirty", "w")
    dirty_file.write("".join([
        d for d in sh.git("status", "--porcelain")
        if d.strip().split(" ")[-1] not in [u"dist"]
    ]))
    dirty_file.close()


@task
def favicon():
    """generate the favicon... ugly"""
    proj()
    print(". generating favicons...")
    sizes = [16, 32, 64, 128]

    tmp_file = lambda size: "/tmp/favicon-%s.png" % size

    for size in sizes:
        print("... %sx%s" % (size, size))
        sh.convert(
            "design/logo.svg",
            "-resize",
            "%sx%s" % (size, size),
            tmp_file(size))

    print(".. generating bundle")

    sh.convert(
        *[tmp_file(size) for size in sizes] + [
            "-colors", 256,
            "static/img/favicon.ico"
        ]
    )

    print(".. cleaning up")
    sh.rm(sh.glob("/tmp/favicon-*.png"))


@task
def copy_assets():
    """copy assets for static serving"""
    proj()

    print(". copying assets ...")

    copy_patterns = {
        "dist": ["./static/lib/jquery-1.8.3.min.js"] +
        sh.glob("./static/config/*.json") +
        sh.glob("./static/fragile-min.*"),

        "dist/font": sh.glob("./static/lib/awesome/font/*"),
        "dist/svg": sh.glob("./static/svg/*.svg"),
        "dist/img": sh.glob("./static/img/*.*") or [],
    }

    for dst, copy_files in copy_patterns.items():
        if not os.path.exists(dst):
            sh.mkdir("-p", dst)

        for c_file in copy_files:
            print "... copying", c_file, dst
            sh.cp("-r", c_file, dst)

    wa_cache = "./dist/.webassets-cache"

    if os.path.exists(wa_cache):
        sh.rm("-r", wa_cache)


@task
def patch_css():
    """fix css paths... might be able to do this with `cssrewrite`"""
    proj()
    css_path = "./dist/fragile-min.css"

    css_file = open(css_path, "r")
    css = css_file.read()
    css_file.close()

    css_file = open(css_path, "w")
    css_file.write(css.replace("../lib/awesome/font/", "./font/"))
    css_file.close()


@task
def html():
    """use the `build` app style to generate the hosted static html"""
    proj()
    print ". generating production html"

    app = make_app("build")

    prod_files = {
        "dist/index.html": "/dist/",
    }

    for prod_file, url in prod_files.items():
        print ".. writing ", prod_file
        open(prod_file, "w").write(
            app.test_client().get(url).data
            .replace('src="/lib/', 'src="./')
            .replace('src="/', 'src="./')
            .replace('href="/', 'href="./')
        )


@task
def serve_dev():
    """yup"""
    serve("dev")


@task
def serve_prod():
    """also, this"""
    serve("prod")


@task
def serve_build():
    """needed for building assets"""
    serve("build")


@task
def serve_test():
    """TODO: write some tests"""
    serve("test")


def serve(env):
    """serve stuff... prod is mostly done by just doing `python fragile.py`"""
    app = make_app(env)

    port = {
        "prod": 5000,
        "dev": 5001,
        "test": 5002,
        "build": 5003,
    }[env]

    app.run(port=port)
