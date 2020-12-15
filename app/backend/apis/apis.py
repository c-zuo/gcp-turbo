from flask_restx import Namespace, Resource, fields, reqparse, inputs

api = Namespace('apis', description='Google Cloud Platform APIs')
apimodel = api.model(
    'Api', {
        'api':
            fields.String(required=True, description='API service name'),
        'title':
            fields.String(required=True, description='API title'),
        'description':
            fields.String(description='API description'),
        'preApproved':
            fields.Boolean(required=True,
                           description='Is API pre-approved for use'),
    })

apis = []


class Apis:

    def get_namespace(config):
        for _name, _api in config['approvedApis']['approved'].items():
            apis.append({
                'api': _name,
                'title': _api['title'],
                'description': _api['description'],
                'preApproved': True,
            })
        for _name, _api in config['approvedApis']['holdForApproval'].items():
            apis.append({
                'api': _name,
                'title': _api['title'],
                'description': _api['description'],
                'preApproved': False,
            })

        return api


@api.route('/')
class ApisList(Resource):

    @api.doc('list_apis')
    @api.marshal_list_with(apimodel)
    def get(self):
        '''List all APIs'''
        parser = reqparse.RequestParser()
        parser.add_argument('filterPrefix',
                            type=inputs.regex('.{2,}'),
                            required=False,
                            trim=True,
                            help='Filter prefix')
        parser.add_argument('filterContains',
                            type=inputs.regex('.{2,}'),
                            required=False,
                            trim=True,
                            help='Filter contains')
        args = parser.parse_args()
        if args['filterPrefix']:
            _apis = []
            for item in apis:
                if item['api'].lower().startswith(args['filterPrefix'].lower(
                )) or item['title'].lower().startswith(
                        args['filterPrefix'].lower()):
                    _apis.append(item)
            return _apis
        if args['filterContains']:
            _apis = []
            for item in apis:
                if args['filterContains'].lower() in item['api'].lower(
                ) or args['filterContains'].lower() in item['title'].lower():
                    _apis.append(item)
            return _apis
        return apis


@api.route('/<string:id>')
@api.param('id', 'The API identifier')
class Api(Resource):

    @api.doc('get_api')
    @api.marshal_with(apimodel)
    def get(self, id):
        '''Get an API'''
        _ret = next((item for item in apis if item['api'] == id), None)
        if not _ret:
            api.abort(404, "API {} doesn't exist".format(id))
        return _ret
