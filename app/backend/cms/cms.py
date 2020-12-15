from flask_restx import Namespace, Resource, fields
from core import persistence

api = Namespace('cms', description='Content management system')
apimodel = api.model(
    'Cms', {
        'id':
            fields.String(required=True, description='Page identifier'),
        'title':
            fields.String(required=True, description='Page title'),
        'content':
            fields.String(description='Page content', skip_none=True),
        'boxes':
            fields.Nested(
                {
                    'title':
                        fields.String(description='Box title'),
                    'content':
                        fields.String(description='Box content'),
                    'link':
                        fields.Nested(
                            {
                                'href':
                                    fields.String(description='Box link URL'),
                                'title':
                                    fields.String(description='Box link title'),
                            },
                            description='Box link')
                },
                description='Content boxes',
                skip_none=True)
    })

pages = []


class Cms:

    def get_namespace(config):
        if 'cms' in config['config']['app']['backend']:
            for page in config['config']['app']['backend']['cms']:
                if 'boxes' not in page:
                    page['boxes'] = []
                pages.append(page)
        CmsList.pages = pages
        CmsPage.pages = pages
        return api


@api.route('/')
class CmsList(Resource):
    pages = None

    @api.doc('list_cms_pages')
    @api.marshal_list_with(apimodel)
    def get(self):
        '''List all CMS pages'''
        return self.pages


@api.route('/<string:id>')
@api.param('id', 'The CMS page identifier')
@api.response(404, 'CMS page not found')
class CmsPage(Resource):
    pages = None

    @api.doc('get_cms_page')
    @api.marshal_with(apimodel)
    def get(self, id):
        '''Get a CMS page'''
        for page in self.pages:
            if page['id'] == id:
                return page
        return None