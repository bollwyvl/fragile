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

sys.path.append(os.getcwd())

# primary import
from fragile import make_app

application = make_app("prod")
