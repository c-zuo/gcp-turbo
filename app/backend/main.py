#!/usr/bin/env python3
from flask import Flask, Blueprint, request, g
from flask_restx import Api, Resource
from validators.validators import get_validators
import os
import sys
import yaml
import yamale
import logging
import gzip
import base64
from pythonjsonlogger import jsonlogger
from core.auth import validate_iap_jwt
from ipaddress import ip_address, ip_network
from google.api_core.gapic_v1 import client_info as grpc_client_info
from google.cloud import secretmanager

from info.info import Info
from environments.environments import Environments
from teams.teams import Teams
from folders.folders import Folders
from apis.apis import Apis
from users.users import Users
from groups.groups import Groups
from projects.projects import Projects
from repositories.repositories import Repositories
from chargingcodes.chargingcodes import ChargingCodes
from cms.cms import Cms


def setup_logging():
    logger = logging.getLogger('tpf-backend')
    if os.getenv('LOG_LEVEL'):
        print('Setting log level to %d' % int(os.getenv('LOG_LEVEL')),
              file=sys.stderr)
        logger.setLevel(int(os.getenv('LOG_LEVEL')))
    else:
        logger.setLevel(logging.INFO)
    json_handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter()
    json_handler.setFormatter(formatter)
    logger.addHandler(json_handler)
    return logger


logger = setup_logging()
app = Flask('tpf-backend')
api = Api(title='Turbo Project Factory backend',
          version='1.0',
          description='Backend methods for Turbo Project Factory',
          doc='/api/v1')

config_file = 'config.yaml'
config = {}
if os.getenv('CONFIG'):
    secret_manager_url = os.getenv('CONFIG')
    logger.debug('Loading configuration from Secret Manager: %s' %
                 (secret_manager_url))
    client_info = grpc_client_info.ClientInfo(
        user_agent='google-pso-tool/turbo-project-factory/1.0.0')
    client = secretmanager.SecretManagerServiceClient(client_info=client_info)
    response = client.access_secret_version(name=secret_manager_url)
    response_payload = response.payload.data.decode('UTF-8')
    if response_payload.startswith('gzip:'):  # Compress config
        response_payload = gzip.decompress(
            base64.b64decode(response_payload[5:])).decode('UTF-8')
    config = yaml.load(response_payload, Loader=yaml.SafeLoader)
    config['schema'] = yamale.make_schema(
        content=config['schema'],
        validators=get_validators(cfg_file=config['config'],
                                  approved_apis_file=config['approvedApis'],
                                  backend=True))
elif os.path.exists(config_file):
    with open(config_file) as f:
        config = yaml.load(f, Loader=yaml.SafeLoader)
        config['schema'] = yamale.make_schema(content=config['schema'],
                                              validators=get_validators(
                                                  config['config'],
                                                  config['approvedApis']))

api.add_namespace(Info.get_namespace(config), path='/api/v1/info')
api.add_namespace(Environments.get_namespace(config),
                  path='/api/v1/environments')
api.add_namespace(Teams.get_namespace(config), path='/api/v1/teams')
api.add_namespace(Folders.get_namespace(config), path='/api/v1/folders')
api.add_namespace(Apis.get_namespace(config), path='/api/v1/apis')
api.add_namespace(Users.get_namespace(config), path='/api/v1/users')
api.add_namespace(Groups.get_namespace(config), path='/api/v1/groups')
api.add_namespace(Projects.get_namespace(config), path='/api/v1/projects')
api.add_namespace(Repositories.get_namespace(config),
                  path='/api/v1/repositories')
api.add_namespace(ChargingCodes.get_namespace(config),
                  path='/api/v1/chargingcodes')
api.add_namespace(Cms.get_namespace(config), path='/api/v1/cms')

api.init_app(app)


def handle_frontend():
    requested_path = request.path[1:len(request.path)]
    if requested_path == '':
        requested_path = 'index.html'

    if not requested_path.startswith('/api'):
        static_dir = '%s/static/' % (os.getcwd())
        requested_file = '%s%s' % (static_dir, requested_path)
        if os.path.commonprefix(
            (os.path.realpath(requested_file), static_dir)) != static_dir:
            return 'Forbidden', 403
        if os.path.exists(requested_file):
            if requested_file.endswith('.html'):
                g.send_mimetype = 'text/html'
            if requested_file.endswith('.js') or requested_file.endswith(
                    '.js.map'):
                g.send_mimetype = 'text/javascript'
            if requested_file.endswith('.json'):
                g.send_mimetype = 'application/json'
            if requested_file.endswith('.txt'):
                g.send_mimetype = 'text/plain'
            if requested_file.endswith('.css') or requested_file.endswith(
                    '.map'):
                g.send_mimetype = 'text/css'
            if requested_file.endswith('.ico'):
                g.send_mimetype = 'image/vnd.microsoft.icon'
            if requested_file.endswith('.jpg') or requested_file.endswith(
                    '.jpeg'):
                g.send_mimetype = 'image/jpeg'
            if requested_file.endswith('.png'):
                g.send_mimetype = 'image/png'
            with open(requested_file, 'rb') as file:
                data = file.read()
                return data, 200


@app.before_request
def before_request():
    g.send_mimetype = None
    if 'noAuthenticationCIDRs' in config['config']['app']['backend']:
        remote_ip = ip_address(request.remote_addr)
        for cidr in config['config']['app']['backend']['noAuthenticationCIDRs']:
            if remote_ip in ip_network(cidr):
                request.environ['user'] = config['config']['app']['backend'][
                    'noAuthenticationUsername']
                request.environ['user_nodomain'] = config['config']['app'][
                    'backend']['noAuthenticationUsername'].split('@')[0]
                request.environ['email'] = config['config']['app']['backend'][
                    'noAuthenticationEmail']

                return handle_frontend()

    if 'x-goog-iap-jwt-assertion' in request.headers:
        iap_audience = config['config']['app']['backend']['iapAudience']
        if os.getenv('IAP_AUDIENCE'):
            iap_audience = os.getenv(
                'IAP_AUDIENCE')  # Solves cyclical dependency issue
        user = validate_iap_jwt(request.headers['x-goog-iap-jwt-assertion'],
                                iap_audience)
        if user[0]:
            request.environ['user'] = user[1]
            request.environ['user_nodomain'] = user[1].split('@')[0]
            request.environ['email'] = user[1]
            return handle_frontend()
        else:
            logger.error(user[2], extra={'expected_audience': iap_audience
                                        })  # Log validation error

    api.abort(403, 'Forbidden')


@app.after_request
def after_request(response):
    if os.getenv('DEBUGGING') != '':
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers',
                             'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods',
                             'GET,PUT,POST,DELETE,PATCH')
    if g.send_mimetype:
        response.headers['Content-Type'] = g.send_mimetype
    return response


@api.route('/health')
class HealthCheck(Resource):

    def get(self):
        return {'ok': True}


def create_app():
    return app


if __name__ == '__main__':
    create_app().run(debug=True if os.getenv('DEBUG') else False,
                     host='0.0.0.0',
                     port=int(os.environ.get('PORT', 8080)))
