import os.path
import hashlib
import tempfile
from googleapiclient.discovery_cache.base import Cache


class DiscoveryCache(Cache):

    def filename(self, url):
        return os.path.join(
            tempfile.gettempdir(),
            'google_api_discovery_' + hashlib.md5(url.encode()).hexdigest())

    def get(self, url):
        try:
            with open(self.filename(url), 'rb') as f:
                return f.read().decode()
        except FileNotFoundError:
            return None

    def set(self, url, content):
        with tempfile.NamedTemporaryFile(delete=False) as f:
            f.write(content.encode())
            f.flush()
            os.fsync(f)
        os.rename(f.name, self.filename(url))


cache = DiscoveryCache()


def get_discovery_cache():
    return cache