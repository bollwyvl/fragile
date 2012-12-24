#!/usr/bin/env python
"""
fabric tasks for repetitive fragile tasks
"""

import os
import sys
from pprint import pprint

from fabric.api import task

import sh
import pkgutil

PROJECT_ROOT = str(sh.git("rev-parse", **{"show-toplevel": True})).strip()
PROJECT_SHA = str(sh.git("rev-parse", "HEAD")).strip()

CFG_TEMPLATE = """# do not modify this file. generated automatically
[minify_%(src)s]
sources = %(assets)s
output = dist/%(src)s/fragile-min.%(src)s

"""

FLASK_BS = os.path.join(
    pkgutil.get_loader("flask_bootstrap").filename, "static")

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
    sh.pep8("fabfile.py", "app.py")


@task
def build():
    proj()
    flake()
    clean()
    favicon()
    copy_assets()
    html()
    minify()
    dirty()
    sh.cd("dist")
    sh.git("add", ".")
    print sh.git("status")


@task
def dev():
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
  dirty_file = open("dirty", "w")
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
        "dist/font": sh.glob("./static/lib/awesome/font/*"),
        "dist/css": [],
        "dist/js": [],
        "dist/svg": sh.glob("./static/svg/*.svg"),
        "dist": sh.glob("./static/config/*.json"),
        "dist/img": sh.glob("./static/img/*.*") or [],
    }

    for dst, copy_files in copy_patterns.items():
        os.path.exists(dst) or sh.mkdir("-p", dst)
        for c_file in copy_files:
            print "... copying", c_file, dst
            sh.cp("-r", c_file, dst)
            
@task
def html():
    proj()
    print ". generating production html"
    
    fragile_path = os.path.abspath(os.path.dirname(__file__))
    sys.path.append(fragile_path)

    from fragile import make_app
    app = make_app("prod")
    
    prod_files = {
        "dist/index.html": "/dist/",
    }
    
    for prod_file, url in prod_files.items():
        print ".. writing ", prod_file
        open(prod_file, "w").write(
            app.test_client().get(url).data
        )

@task
def minify():
    proj()
    print(". minifying ...")

    sources = dict(js=[], css=[])
    
    # blarg
    # bootstrap
    sources["css"] = [os.path.join(FLASK_BS, "css", item) for item in 
        ["bootstrap.no-icons.min.css",
        "bootstrap-responsive.min.css"]
    ]
    
    
    for user in ["."]:
        for min_id, asset_list in dict(js="scripts", css="styles").items(): 
            asset_list = os.path.join(user, asset_list+".txt")
            if os.path.exists(asset_list):
                [
                    sources[min_id].append(asset)
                    for asset
                    in [x.strip() for x in open(asset_list).read().split("\n")]
                    if asset
                        and not asset.startswith("#")
                        and asset not in sources[min_id]
                ]
    

    
    sources["js"][1:1] = [os.path.join(FLASK_BS,"js", "bootstrap.min.js")]
    
    cfg = open("setup.cfg", "w")

    cfg.writelines([
        CFG_TEMPLATE % {"src": src, "assets": " ".join(assets)}
        for src, assets in sources.items()
    ])

    print ".. writing out production setup.cfg"
    cfg.close()

    [
        pprint(sh.python("setup.py", "minify_" + src, verbose=True))
        for src in sources
    ]
    
@task
def serve_dev():
    serve("dev")

@task
def serve_prod():
    serve("prod")
    
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
        "test": 5002
    }[env]
    
    app.run(port=port)