from flask_restx import Namespace, Resource, fields
from flask import request

api = Namespace('info', description='Logged in user')
info = api.model(
    'Info', {
        'email': fields.String(required=True, description='Team id'),
        'user_id': fields.String(required=True, description='Team title'),
        'user_nodomain': fields.String(required=True, description='Team title')
    })


class Info:

    def get_namespace(config):
        return api


@api.route('/')
class InfoList(Resource):

    @api.doc('get_user_info')
    @api.marshal_with(info)
    def get(self):
        '''List logged in user info'''
        return {
            'email': request.environ['email'],
            'user_id': request.environ['user'],
            'user_nodomain': request.environ['user_nodomain']
        }
