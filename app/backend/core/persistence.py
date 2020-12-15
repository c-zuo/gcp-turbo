from core.backends.git_backend import GitBackend
from core.backends.gitlab_backend import GitlabBackend
from core.repository_backends.gitlab_backend import GitlabRepositoryBackend
from core.chargingcode_backends.gcs_backend import GcsChargingCodeBackend


def get_backend(backend_type, backend_config, global_config):
    if backend_type == 'git':
        return GitBackend(backend_config, global_config)
    if backend_type == 'gitlab':
        return GitlabBackend(backend_config, global_config)
    raise Exception('Unknown backend %s' % backend_type)


def get_repository_backend(backend_type, backend_config):
    if backend_type == 'gitlab':
        return GitlabRepositoryBackend(backend_config)
    raise Exception('Unknown backend %s' % backend_type)


def get_chargingcode_backend(backend_type, backend_config, global_config):
    if backend_type == 'gcs':
        return GcsChargingCodeBackend(backend_config, global_config)
    raise Exception('Unknown backend %s' % backend_type)
