from core.repository_backend import RepositoryBackend
from flask import request
from gitlab import Gitlab


class GitlabRepositoryBackend(RepositoryBackend):
    gitlabUrl = None
    gitlabToken = None
    gitlabProject = None
    gitlabSudoEnabled = False
    gitlabSudo = None
    gitlab = None
    gitlabLabels = []

    def __init__(self, config):
        super().__init__(config)

        self.gitlabUrl = config['gitlabUrl']
        self.gitlabToken = config['gitlabToken']
        self.gitlabProject = config['gitlabProject']
        if 'gitlabSudo' in config and config['gitlabSudo']:
            self.gitlabSudoEnabled = True

        if 'gitlabLabels' in config:
            self.gitlabLabels = config['gitlabLabels']
        else:
            self.gitlabLabels = []

        self.gitlab = Gitlab(self.gitlabUrl, private_token=self.gitlabToken)

    def _init_sudo(self):
        if self.gitlabSudoEnabled:
            self.gitlabSudo = request.environ['user_nodomain']

    def get_groups(self):
        self._init_sudo()
        groups = self.gitlab.groups.list(all=True, sudo=self.gitlabSudo)
        _ret = []
        for group in groups:
            if group.path != 'lost-and-found':
                _ret.append({
                    'id': group.id,
                    'path': group.full_path,
                    'title': group.full_name,
                    'description': group.description
                })
        _ret.sort(key=lambda e: e['title'].lower())
        return _ret

    def get_group(self, group_id):
        self._init_sudo()
        group = self.gitlab.groups.get(group_id, sudo=self.gitlabSudo)
        if group:
            return {
                'id': group.id,
                'path': group.full_path,
                'title': group.full_name,
                'description': group.description
            }
        return None

    def get_repositories(self, group_id):
        self._init_sudo()
        group = self.gitlab.groups.get(group_id, sudo=self.gitlabSudo)
        projects = group.projects.list(all=True, sudo=self.gitlabSudo)
        _ret = []
        for project in projects:
            _ret.append({
                'id': project.id,
                'path': project.path_with_namespace,
                'title': project.full_name,
                'description': project.description
            })
        return _ret

    def get_repository(self, group_id, id):
        self._init_sudo()
        project = self.gitlab.projects.get(id, sudo=self.gitlabSudo)
        if project:
            return {
                'id': project.id,
                'path': project.path_with_namespace,
                'title': project.name,
                'description': project.description
            }
        return None
