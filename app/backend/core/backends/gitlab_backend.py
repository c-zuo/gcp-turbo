from core.backends.git_backend import GitBackend
from flask import request
import tempfile
import pygit2
import glob
import yaml
import os
import time
import logging
from gitlab import Gitlab


class GitlabBackend(GitBackend):
    gitlabUrl = None
    gitlabToken = None
    gitlabProject = None
    gitlabSudo = None
    gitlabSudoEnabled = False
    gitlab = None
    gitlabLabels = []

    def __init__(self, config, global_config):
        super().__init__(config, global_config)

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

    def add_project(self, project_id, project_request):
        self._init_sudo()
        branch_name = super().add_project(project_id, project_request)

        merge_request_title = 'Add project: %s (%s)' % (
            project_request['displayName'], project_id)
        if 'description' in project_request:
            merge_request_body = project_request['description']
        else:
            merge_request_body = '(no project description was provided)'

        project = self.gitlab.projects.get(self.gitlabProject,
                                           sudo=self.gitlabSudo)
        mr = project.mergerequests.create(
            {
                'source_branch': branch_name,
                'target_branch': 'master',
                'title': merge_request_title,
                'description': merge_request_body,
                'labels': self.gitlabLabels,
                'remove_source_branch': True,
                'allow_collaboration': True,
                'squash': True,
            },
            sudo=self.gitlabSudo)
        return True, mr.web_url
