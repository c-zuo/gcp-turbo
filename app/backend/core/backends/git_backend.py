from core.backend import Backend
import tempfile
import pygit2
import glob
import yaml
import os
import time
import logging
from googleapiclient.discovery import build
import googleapiclient.errors
from flask import request
from core import token
from google.oauth2.credentials import Credentials


class GitBackend(Backend):
    logger = None
    repo = None
    repoUrl = None
    credentials = None
    callbacks = None
    projectsPath = None
    tempDirectory = None
    sshKeyTempDirectory = None
    global_config = {}

    def __init__(self, config, global_config):
        self.global_config = global_config
        self.logger = logging.getLogger('tpf-backend')

        self.tempDirectory = tempfile.TemporaryDirectory()
        self.sshKeyTempDirectory = tempfile.TemporaryDirectory()
        self.repoUrl = config['repoUrl']
        if not self.repoUrl.startswith('https://'):
            if not bool(pygit2.features & pygit2.GIT_FEATURE_SSH):
                raise Exception(
                    'pygit2 does not have SSH support (compile with libgit2 with libssh2)'
                )

        if 'username' in config and not 'password' in config and not 'privateKey' in config:
            self.logger.debug('Using only username as credentials.',
                              extra={'username': config['username']})
            self.credentials = pygit2.credentials.Username(config['username'])
        if 'username' in config and 'password' in config:
            self.logger.debug('Using username and password as credentials.',
                              extra={'username': config['username']})
            self.credentials = pygit2.credentials.UserPass(
                config['username'], config['password'])
        if 'username' in config and 'publicKey' in config and 'privateKey' in config:
            self.logger.debug(
                'Using SSH private/public key pair as credentials.',
                extra={
                    'username': config['username'],
                    'publicKey': config['publicKey']
                })
            if 'useFileSshKeys' in config and config['useFileSshKeys']:
                ssh_key_path = '%s/id' % self.sshKeyTempDirectory.name
                ssh_pubkey_path = '%s/id.pub' % self.sshKeyTempDirectory.name
                with open(ssh_key_path, 'w+t') as f:
                    f.write(config['privateKey'])
                with open(ssh_pubkey_path, 'w+t') as f:
                    f.write(config['publicKey'])
                self.credentials = pygit2.credentials.Keypair(
                    config['username'], ssh_pubkey_path, ssh_key_path,
                    config['passphrase'] if 'passphrase' in config else None)
            else:
                self.credentials = pygit2.credentials.KeypairFromMemory(
                    config['username'], config['publicKey'],
                    config['privateKey'],
                    config['passphrase'] if 'passphrase' in config else None)

        self.callbacks = pygit2.RemoteCallbacks(credentials=self.credentials)

        self.projectsPath = config[
            'projectsPath'] if 'projectsPath' in config else 'projects/'
        if not self.projectsPath.endswith('/'):
            self.projectsPath = '%s/' % self.projectsPath

        pass

    def _clone_repo(self):
        print(self.callbacks)
        if not self.repo:
            self.logger.info('Cloning repository.',
                             extra={'repository': self.repoUrl})
            self.repo = pygit2.clone_repository(self.repoUrl,
                                                self.tempDirectory.name,
                                                bare=False,
                                                callbacks=self.callbacks)

    def __del__(self):
        if self.tempDirectory:
            self.tempDirectory.cleanup()
        if self.sshKeyTempDirectory:
            self.sshKeyTempDirectory.cleanup()

    def _fixup_project(self, project):
        if 'owner' in project['project']:
            project['project']['owners'] = [project['project']['owner']]
            project['project'].pop('owner', None)
        return project

    def _reverse_fixup_project(self, project):
        if 'owners' in project['project']:
            project['project']['owner'] = project['project']['owners'][0]
            project['project'].pop('owners', None)
        return project

    def get_projects(self):
        self._clone_repo()
        projects = []
        self.logger.info('Listing projects from repository.',
                         extra={'repository': self.repoUrl})
        for project in glob.glob('%s/%s*.yaml' %
                                 (self.tempDirectory.name, self.projectsPath)):
            with open(project) as f:
                _project = yaml.load(f, Loader=yaml.SafeLoader)
                if 'project' in _project:
                    projects.append(self._fixup_project(_project)['project'])
        return projects

    def get_project(self, project_id):
        self._clone_repo()
        self.logger.info('Getting one project from repository.',
                         extra={
                             'repository': self.repoUrl,
                             'id': project_id
                         })

        projects = []
        project_path = '%s/%s%s.yaml' % (self.tempDirectory.name,
                                         self.projectsPath, project_id)
        if os.path.exists(project_path):
            with open(project_path) as f:
                _project = yaml.load(f, Loader=yaml.SafeLoader)
                if 'project' in _project:
                    return self._fixup_project(_project)['project']
        return None

    def add_project(self, project_id, project_request):
        self._clone_repo()
        self.logger.debug('Repository references.',
                          extra={'refs': list(self.repo.references)})

        self.logger.info('Adding a new project to repository.',
                         extra={
                             'repository': self.repoUrl,
                             'id': project_id,
                             'project': project_request
                         })

        branch_name = 'project-%s' % project_id
        if 'refs/remotes/origin/%s' % (branch_name) in list(
                self.repo.references):
            raise Exception('Project branch %s already exists in repository!' %
                            branch_name)

        ref = self.repo.lookup_reference('refs/heads/master')
        self.repo.checkout(ref)

        branch = self.repo.create_branch(branch_name, self.repo.head.peel())
        ref = self.repo.lookup_reference(branch.name)
        self.logger.debug('Looking up branch reference and checking it out.',
                          extra={
                              'repository': self.repoUrl,
                              'branch': branch_name
                          })
        self.repo.checkout(ref)
        self.repo.remotes['origin'].fetch(callbacks=self.callbacks)

        project_path = '%s/%s%s.yaml' % (self.tempDirectory.name,
                                         self.projectsPath, project_id)
        relative_path = '%s%s.yaml' % (self.projectsPath, project_id)
        if os.path.exists(project_path):
            raise Exception('Project %s already exists!' % project_id)

        self.logger.debug('Writing project request.',
                          extra={
                              'repository': self.repoUrl,
                              'path': project_path
                          })

        with open(project_path, 'w') as f:
            f.write(
                yaml.dump(self._reverse_fixup_project(
                    {'project': project_request}),
                          sort_keys=False))

        self.logger.debug('Creating a branch.',
                          extra={
                              'repository': self.repoUrl,
                              'branch': branch_name
                          })

        self.repo.index.add(relative_path)
        self.repo.index.write()

        credentials = Credentials(
            token.get_access_token_for_scopes(self.global_config, [
                'https://www.googleapis.com/auth/admin.directory.user.readonly'
            ]))

        user_name = request.environ['email']
        user_service = build('admin', 'directory_v1', credentials=credentials)
        try:
            user = user_service.users().get(
                userKey=request.environ['user']).execute()
            if 'name' in user and 'fullName' in user['name']:
                user_name = user['name']['fullName']
        except Exception:
            logger.exception(
                'Error fetching user, using email address instead for commit.',
                exc_info=True)

        author = pygit2.Signature(user_name, request.environ['email'])
        committer = pygit2.Signature(user_name, request.environ['email'])
        if project_request['description'] != '':
            message = 'Add project %s: %s' % (project_id,
                                              project_request['description'])
        else:
            message = 'Add project %s' % project_id
        tree = self.repo.index.write_tree()
        oid = self.repo.create_commit('refs/heads/%s' % branch_name, author,
                                      committer, message, tree,
                                      [self.repo.head.target])
        self.logger.debug('Commit created.',
                          extra={
                              'repository': self.repoUrl,
                              'branch': branch_name,
                              'commit': oid,
                          })
        self.repo.remotes['origin'].push(
            ['refs/heads/%s:refs/heads/%s' % (branch_name, branch_name)],
            callbacks=self.callbacks)
        self.logger.debug('Pushed to remote.',
                          extra={
                              'repository':
                                  self.repoUrl,
                              'branch':
                                  branch_name,
                              'pushRefs':
                                  'refs/heads/%s:refs/heads/%s' %
                                  (branch_name, branch_name),
                          })
        return branch_name
