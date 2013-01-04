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
sys.path.append.extend([os.getcwd(), os.path.join(os.getcwd(), "app")])

try:
    import local_config
except ImportError:
    pass

# primary import
from fragile import make_app

application = make_app("prod")
