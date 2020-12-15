from flask_restx import Namespace, Resource, fields, reqparse, inputs
from googleapiclient.discovery import build
import googleapiclient.errors
import logging
from core import token
from core.cache import get_discovery_cache
from google.oauth2.credentials import Credentials

logger = logging.getLogger('tpf-backend')

api = Namespace('users', description='Users')
apimodel = api.model(
    'User', {
        'email': fields.String(required=True, description='User primary email'),
        'name': fields.String(description='Full name'),
        'title': fields.String(description='Job title'),
        'photo': fields.String(description='Photo'),
        'photo_mimetype': fields.String(description='Photo MIME type'),
        'photo_width': fields.Integer(description='Photo width in pixels'),
        'photo_height': fields.Integer(description='Photo height in pixels'),
    })


def _escape_query_arg(query):
    return query.replace('"', '\\"')


class Users:

    def get_namespace(config):
        UsersList.customer_id = config['config']['cloudIdentityCustomerId']
        User.customer_id = config['config']['cloudIdentityCustomerId']
        UsersList.config = config
        User.config = config
        return api


@api.route('/')
@api.doc(
    params={
        'filterPrefix': 'Filter users by prefix',
        'filterContains': 'Filter users by substring'
    })
class UsersList(Resource):
    customer_id = None
    config = {}

    @api.doc('list_users')
    @api.marshal_list_with(apimodel)
    def get(self):
        '''List all users'''
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
        query = None
        if args['filterPrefix']:
            query = 'email:"%s*"' % (_escape_query_arg(args['filterPrefix']))
        if args['filterContains']:
            query = '"%s"' % (_escape_query_arg(args['filterContains']))

        credentials = Credentials(
            token.get_access_token_for_scopes(self.config, [
                'https://www.googleapis.com/auth/admin.directory.user.readonly'
            ]))

        user_service = build('admin',
                             'directory_v1',
                             credentials=credentials,
                             cache=get_discovery_cache())
        results = user_service.users().list(customer=self.customer_id,
                                            query=query,
                                            projection='full',
                                            maxResults=10).execute()
        if 'users' in results:
            _ret = []
            for user in results['users']:
                if 'suspended' in user and user['suspended']:
                    continue

                title = ''
                if 'organizations' in user:
                    if 'title' in user['organizations'][0]:
                        title = user['organizations'][0]['title']

                _user = {
                    'email': user['primaryEmail'],
                    'name': user['name']['fullName'],
                    'title': title,
                }
                try:
                    photo_results = user_service.users().photos().get(
                        userKey=user['primaryEmail']).execute()
                    if 'photoData' in photo_results:
                        _user['photo'] = photo_results['photoData']
                        _user['photo_mimetype'] = photo_results['mimeType']
                        _user['photo_width'] = photo_results['width']
                        _user['photo_height'] = photo_results['height']
                except Exception as e:
                    pass
                _ret.append(_user)
            return _ret
        return []


@api.route('/<string:id>')
@api.param('id', 'User primary email address')
class User(Resource):
    customer_id = None
    config = {}

    @api.doc('get_user')
    @api.marshal_with(apimodel)
    def get(self, id):
        '''Get a user'''
        credentials = Credentials(
            token.get_access_token_for_scopes(self.config, [
                'https://www.googleapis.com/auth/admin.directory.user.readonly'
            ]))

        user_service = build('admin',
                             'directory_v1',
                             credentials=credentials,
                             cache=get_discovery_cache())
        try:
            query = 'email="%s"' % _escape_query_arg(id)
            results = user_service.users().list(customer=self.customer_id,
                                                query=query,
                                                projection='full',
                                                maxResults=1).execute()
        except Exception:
            logger.exception('Error fetching user', exc_info=True)
            api.abort(404, "User {} doesn't exist".format(id))

        if 'users' in results:
            for user in results['users']:
                if 'suspended' in user and user['suspended']:
                    continue

                title = ''
                if 'organizations' in user:
                    if 'title' in user['organizations'][0]:
                        title = user['organizations'][0]['title']

                _user = {
                    'email': user['primaryEmail'],
                    'name': user['name']['fullName'],
                    'title': title,
                }
                try:
                    photo_results = user_service.users().photos().get(
                        userKey=user['primaryEmail']).execute()
                    if 'photoData' in photo_results:
                        _user['photo'] = photo_results['photoData']
                        _user['photo_mimetype'] = photo_results['mimeType']
                        _user['photo_width'] = photo_results['width']
                        _user['photo_height'] = photo_results['height']
                except Exception as e:
                    pass

                return _user
        api.abort(404, "User {} doesn't exist".format(id))
