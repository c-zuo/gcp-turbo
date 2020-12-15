from flask_restx import Namespace, Resource, fields, reqparse, inputs
from googleapiclient.discovery import build
import googleapiclient.errors
import logging
from core import token
from core.cache import get_discovery_cache
from google.oauth2.credentials import Credentials

logger = logging.getLogger('tpf-backend')

api = Namespace('groups', description='Groups')
apimodel = api.model(
    'Groups', {
        'id': fields.String(required=True, description='Group ID'),
        'email': fields.String(required=True, description='Group email'),
        'name': fields.String(description='Group display name'),
        'description': fields.String(description='Group description'),
    })


def _escape_query_arg(query):
    return query.replace(' ', '-')


class Groups:

    def get_namespace(config):
        GroupsList.customer_id = config['config']['cloudIdentityCustomerId']
        Group.customer_id = config['config']['cloudIdentityCustomerId']
        GroupsList.config = config
        Group.config = config
        return api


@api.route('/')
@api.doc(params={'filterPrefix': 'Filter groups by prefix'})
class GroupsList(Resource):
    customer_id = None
    config = {}

    @api.doc('list_groups')
    @api.marshal_list_with(apimodel)
    def get(self):
        '''List all groups'''
        parser = reqparse.RequestParser()
        parser.add_argument('filterPrefix',
                            type=inputs.regex('.{2,}'),
                            required=False,
                            trim=True,
                            help='Filter prefix')
        args = parser.parse_args()
        query = None
        if args['filterPrefix']:
            query = 'email:%s* name:%s*' % (_escape_query_arg(
                args['filterPrefix']), _escape_query_arg(args['filterPrefix']))

        credentials = Credentials(
            token.get_access_token_for_scopes(self.config, [
                'https://www.googleapis.com/auth/admin.directory.group.readonly'
            ]))
        group_service = build('admin',
                              'directory_v1',
                              credentials=credentials,
                              cache=get_discovery_cache())
        results = group_service.groups().list(customer=self.customer_id,
                                              maxResults=10,
                                              query=query).execute()
        if 'groups' in results:
            _ret = []
            for group in results['groups']:
                _group = {
                    'id': group['id'],
                    'email': group['email'],
                    'name': group['name'],
                    'description': group['description'],
                }
                _ret.append(_group)
            return _ret
        return []


@api.route('/<string:id>')
@api.param('id', 'Group ID')
class Group(Resource):
    customer_id = None
    config = {}

    @api.doc('get_group')
    @api.marshal_with(apimodel)
    def get(self, id):
        '''Get a group'''
        credentials = Credentials(
            token.get_access_token_for_scopes(self.config, [
                'https://www.googleapis.com/auth/admin.directory.group.readonly'
            ]))
        group_service = build('admin',
                              'directory_v1',
                              credentials=credentials,
                              cache=get_discovery_cache())
        try:
            group = group_service.groups().get(groupKey=id).execute()
        except Exception:
            logger.exception('Error fetching group', exc_info=True)
            api.abort(404, "Group {} doesn't exist".format(id))

        if 'id' in group:
            _group = {
                'id': group['id'],
                'email': group['email'],
                'name': group['name'],
                'description': group['description'],
            }
            return _group

        api.abort(404, "Group {} doesn't exist".format(id))
