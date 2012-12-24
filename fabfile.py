#!/usr/bin/env python
"""
fabric tasks for repetitive fragile tasks
"""

import os
import sys

from fabric.api import task

import sh

PROJECT_ROOT = str(sh.git("rev-parse", **{"show-toplevel": True})).strip()
PROJECT_SHA = str(sh.git("rev-parse", "HEAD")).strip()

@task
def proj():
    sh.cd(PROJECT_ROOT)


@task
def flake():
    print(". running PyFlakes on test equipment")
    proj()
    sh.pyflakes("setup.py", "fabfile.py", "fragile.py")


@task
def pep8():
    sh.pep8("fabfile.py", "fragile.py")


@task
def build():
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
    proj()
    sh.git("submodule", "init")
    sh.git("submodule", "update")


@task
def clean():
    proj()
    print ". cleaning up build and dist"
    try:
        sh.rm("-r", sh.glob("dist/*"), sh.glob("build/*"))
    except:
        print ".. already clean"


@task
def dirty():
    proj()
    dirty_file = open(".dirty", "w")
    dirty_file.write("".join([d for d in sh.git("status", "--porcelain")
        if d.strip().split(" ")[-1] not in [u"dist"]]))
    dirty_file.close()

@task
def favicon():
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
    proj()
    
    print(". copying assets ...")
    copy_patterns = {
        "dist": sh.glob("./static/config/*.json") + sh.glob("./static/fragile-min.*") + ["./static/lib/jquery-1.8.3.min.js"],
        "dist/font": sh.glob("./static/lib/awesome/font/*"),
        "dist/svg": sh.glob("./static/svg/*.svg"),
        "dist/img": sh.glob("./static/img/*.*") or [],
    }

    for dst, copy_files in copy_patterns.items():
        os.path.exists(dst) or sh.mkdir("-p", dst)
        for c_file in copy_files:
            print "... copying", c_file, dst
            sh.cp("-r", c_file, dst)
    
    wa_cache = "./dist/.webassets-cache"
    os.path.exists(wa_cache) and sh.rm("-r", wa_cache)
@task
def patch_css():
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
    proj()
    print ". generating production html"
    
    fragile_path = os.path.abspath(os.path.dirname(__file__))
    sys.path.append(fragile_path)

    from fragile import make_app
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
    serve("dev")

@task
def serve_prod():
    serve("prod")

@task
def serve_build():
    serve("build")
    
@task
def serve_test():
    serve("test")

    
def serve(env):
    fragile_path = os.path.abspath(os.path.dirname(__file__))
    sys.path.append(fragile_path)

    from fragile import make_app
    app = make_app(env)
    
    port = {
        "dev": 5000,
        "prod": 5001,
        "test": 5002,
        "build": 5003,
    }[env]
    
    app.run(port=port)