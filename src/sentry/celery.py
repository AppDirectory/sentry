from __future__ import absolute_import

import os
import os.path
import sys

# Add the project to the python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), os.pardir))
sys.stdout = sys.stderr

# Configure the application (Logan) only if it seemingly isnt already
# configured
from django.conf import settings
if not settings.configured:
    from sentry.utils.runner import configure
    configure()

from celery import Celery

app = Celery('sentry')

# Using a string here means the worker will not have to
# pickle the object when using Windows.
app.config_from_object(settings)
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)


if __name__ == '__main__':
    app.start()
