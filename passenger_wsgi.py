"""
Deployment-specific stub for hosting under Passenger WSGI

Should this live in another branch?   
"""
import os
import sys

# Passenger stuff
INTERP = os.path.join(os.environ["HOME"], "fragl_env", "bin", "python")

if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

# add to proper path
sys.path.append(os.path.join(os.getcwd(), "app"))

# primary import
from fragile import make_app

application = make_app("prod")
