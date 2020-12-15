from flask_restx import Namespace, Resource, fields

api = Namespace('environments', description='Project environments')
environment = api.model(
    'Environment', {
        'id':
            fields.String(required=True, description='Environment identifier'),
        'title':
            fields.String(required=True, description='Environment title'),
        'description':
            fields.String(description='Environment description'),
        'budget':
            fields.Integer(description='Environment default budget'),
    })

environments = []


class Environments:

    def get_namespace(config):
        for env in config['config']['environments']:
            environments.append({
                'id':
                    env,
                'title':
                    config['config']['environmentsDescription'][env]['title'],
                'description':
                    config['config']['environmentsDescription'][env]
                    ['description'],
                'budget':
                    config['config']['defaultBudget'][env]
                    if 'defaultBudget' in config['config'] else 0
            })

        return api


@api.route('/')
class EnvironmentsList(Resource):

    @api.doc('list_environments')
    @api.marshal_list_with(environment)
    def get(self):
        '''List all environments'''
        return environments


@api.route('/<string:id>')
@api.param('id', 'The environment identifier')
@api.response(404, 'Environment not found')
class Environment(Resource):

    @api.doc('get_environments')
    @api.marshal_with(environment)
    def get(self, id):
        '''Get an environment'''
        _ret = next((item for item in environments if item['id'] == id), None)
        if not _ret:
            api.abort(404, "Environment {} doesn't exist".format(id))
        return _ret
