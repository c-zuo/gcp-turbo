from flask_restx import Namespace, Resource, fields
from core import persistence

api = Namespace('chargingcodes', description='Charging codes')
chargingcode = api.model(
    'Chargingcode', {
        'id':
            fields.String(required=True,
                          description='Charging code identifier'),
        'title':
            fields.String(required=True, description='Charging code title'),
        'description':
            fields.String(description='Charging code description',
                          skip_none=True),
        'group':
            fields.String(description='Charging code group'),
    })


class ChargingCodes:

    def get_namespace(config):
        backend = persistence.get_chargingcode_backend(
            config['config']['app']['backend']['chargingCodes']['type'],
            config['config']['app']['backend']['chargingCodes'],
            config['config'])

        ChargingCodeList.backend = backend
        ChargingCode.backend = backend

        return api


@api.route('/')
class ChargingCodeList(Resource):
    backend = None

    @api.doc('list_chargingcodes')
    @api.marshal_list_with(chargingcode)
    def get(self):
        '''List all charging codes'''
        return self.backend.get_charging_codes()


@api.route('/<string:id>')
@api.param('id', 'The charging code identifier')
@api.response(404, 'Charging code not found')
class ChargingCode(Resource):

    @api.doc('get_environments')
    @api.marshal_with(chargingcode)
    def get(self, id):
        '''Get an environment'''
        return self.backend.get_charging_code(id)