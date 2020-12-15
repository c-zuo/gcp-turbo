from flask_restx import Namespace, Resource, fields

api = Namespace('teams', description='Project teams')
team = api.model(
    'Team', {
        'id': fields.String(required=True, description='Team id'),
        'title': fields.String(required=True, description='Team title'),
        'description': fields.String(description='Team description'),
    })

teams = []


class Teams:

    def get_namespace(config):
        for _id, _team in config['config']['projectGroups'].items():
            teams.append({
                'id': _id,
                'title': _team['title'],
                'description': _team['description'],
            })

        return api


@api.route('/')
class TeamsList(Resource):

    @api.doc('list_teams')
    @api.marshal_list_with(team)
    def get(self):
        '''List all teams'''
        return teams


@api.route('/<string:id>')
@api.param('id', 'The team identifier')
class Team(Resource):

    @api.doc('get_team')
    @api.marshal_with(team)
    def get(self, id):
        '''Get a team'''
        _ret = next((item for item in teams if item['id'] == id), None)
        if not _ret:
            api.abort(404, "Team {} doesn't exist".format(id))
        return _ret
