from flask_restx import Namespace, Resource, fields
from core import persistence

api = Namespace('repositories', description='Source control repositories')
repository = api.model(
    'Repository', {
        'id': fields.String(required=True, description='Repository id'),
        'path': fields.String(required=True, description='Repository path'),
        'title': fields.String(required=True, description='Repository title'),
        'description': fields.String(description='Repository description'),
    })
repository_group = api.model(
    'RepositoryGroup', {
        'id':
            fields.String(required=True, description='Repository group id'),
        'path':
            fields.String(description='Repository group path'),
        'title':
            fields.String(required=True, description='Repository group title'),
        'description':
            fields.String(description='Repository group description'),
    })


class Repositories:

    def get_namespace(config):

        backend = persistence.get_repository_backend(
            config['config']['app']['backend']['persistence']['type'],
            config['config']['app']['backend']['persistence']['config'])

        RepositoryGroupList.backend = backend
        RepositoryGroup.backend = backend
        RepositoryList.backend = backend
        Repository.backend = backend

        return api


@api.route('/')
class RepositoryGroupList(Resource):
    backend = None

    @api.doc('list_repository_groups')
    @api.marshal_list_with(repository_group)
    def get(self):
        '''List all repository groups'''
        return self.backend.get_groups()


@api.route('/<string:id>')
@api.response(404, 'Repository group not found')
class RepositoryGroup(Resource):
    backend = None

    @api.doc('get_repository_group')
    @api.marshal_with(repository_group)
    def get(self, id):
        '''Get a repository groups'''
        return self.backend.get_group(id)


@api.route('/<string:group_id>/repositories/')
@api.param('group_id', 'The repository group identifier')
@api.response(404, 'Repository group not found')
class RepositoryList(Resource):
    backend = None

    @api.doc('list_group_repositories')
    @api.marshal_list_with(repository)
    def get(self, group_id):
        '''List all repositories in a group'''
        return self.backend.get_repositories(group_id)


@api.route('/<string:group_id>/repositories/<string:id>')
@api.param('group_id', 'The repository group identifier')
@api.param('id', 'The repository identifier')
@api.response(404, 'Repository not found')
class Repository(Resource):
    backend = None

    @api.doc('get_repository')
    @api.marshal_with(repository)
    def get(self, group_id, id):
        '''Get a repository'''
        return self.backend.get_repository(group_id, id)
