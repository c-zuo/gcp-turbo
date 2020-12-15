from flask_restx import Namespace, Resource, fields

api = Namespace('folders', description='Folders')
folder = api.model(
    'Folder', {
        'id': fields.String(required=True, description='Folder id'),
        'title': fields.String(required=True, description='Folder title'),
        'description': fields.String(description='Folder description'),
        'default': fields.Boolean(description='The default folder'),
    })

folders = []


class Folders:

    def get_namespace(config):
        for _id, _folder in config['config']['foldersDescription'].items():
            folders.append({
                'id':
                    _id,
                'title':
                    _folder['title'],
                'description':
                    _folder['description'],
                'default':
                    True
                    if 'default' in _folder and _folder['default'] else False,
            })

        return api


@api.route('/')
class FoldersList(Resource):

    @api.doc('list_folders')
    @api.marshal_list_with(folder)
    def get(self):
        '''List all folders'''
        return folders


@api.route('/<string:id>')
@api.param('id', 'The folder identifier')
@api.response(404, 'Folder not found')
class Folder(Resource):

    @api.doc('get_folder')
    @api.marshal_with(folder)
    def get(self, id):
        '''Get a folder'''
        _ret = next((item for item in folders if item['id'] == id), None)
        if not _ret:
            api.abort(404, "Folder {} doesn't exist".format(id))
        return _ret
