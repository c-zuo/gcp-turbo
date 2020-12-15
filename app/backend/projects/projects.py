from flask_restx import Namespace, Resource, fields, marshal, reqparse, inputs, abort
from flask import request
from core import persistence
import logging
import yaml
import yamale

api = Namespace('projects', description='Projects')

apimodel = None
backend = None
logger = logging.getLogger('tpf-backend')


class FreeformDict(fields.Raw):

    def format(self, value):
        return value


class Projects:

    def get_namespace(config):
        project_fields = {
            'projectId':
                fields.String(required=True, description='Project id'),
            'status':
                fields.String(default='active', description='Project status'),
            'displayName':
                fields.String(required=True,
                              description='Project display name'),
            'description':
                fields.String(description='Project description'),
            'folder':
                fields.String(required=True, description='Project folder'),
            'chargingCode':
                fields.String(description='Project charging code'),
            'owners':
                fields.List(fields.String,
                            description='Project owners',
                            attribute='owners'),
            'environments':
                fields.List(fields.String, description='Project environments'),
            'iap':
                fields.Nested(
                    {
                        'title':
                            fields.String(description='IAP consent screen title'
                                         ),
                    },
                    skip_none=True),
            'gitlab':
                fields.Nested(
                    {
                        'group':
                            fields.String(description='Gitlab group path'),
                        'project':
                            fields.String(description='Gitlab project name'),
                    },
                    skip_none=True),
            'team': {},
            'budget': {},
            'labels':
                FreeformDict(description='Additional project labels',
                             skip_node=True,
                             default={}),
            'additionalApis':
                fields.List(fields.String,
                            description='Additional APIs',
                            default=[]),
            'allowPublicServices':
                fields.Boolean(description='Allow public services',
                               default=False),
        }
        budget_fields = {}
        for _env in config['config']['environments']:
            budget_fields[_env] = fields.Integer(description='Budget for %s' %
                                                 (_env))
        project_fields['budget'] = fields.Nested(
            budget_fields,
            description='Budgets for project',
            skip_none=True,
            attribute='budget')

        team_fields = {}
        for _id, _group in config['config']['projectGroups'].items():
            team_fields[_id] = fields.List(fields.String, attribute=_id)
        project_fields['team'] = fields.Nested(
            team_fields, description='Project team members', skip_none=True)

        apimodel = api.model('Project', project_fields)
        ProjectsList.apimodel = apimodel
        Project.apimodel = apimodel

        ProjectsList.global_config = config
        Project.global_config = config

        ProjectsList.schema = config['schema']
        if 'help' in config['schemaHelp']:
            ProjectsList.schema_help = config['schemaHelp']['help']
        else:
            ProjectsList.schema_help = config['schemaHelp']

        return api


@api.route('/')
class ProjectsList(Resource):
    apimodel = {}
    schema = None
    schema_help = None
    global_config = None

    @api.doc('list_projects')
    def get(self):
        '''List all projects'''
        self.backend = persistence.get_backend(
            self.global_config['config']['app']['backend']['persistence']
            ['type'], self.global_config['config']['app']['backend']
            ['persistence']['config'], self.global_config)

        try:
            projects = self.backend.get_projects()
        except Exception as e:
            abort(500, str(e))
        return api.marshal(projects, self.apimodel)

    def post(self):
        '''Add a new project'''
        parser = reqparse.RequestParser()
        parser.add_argument('dryRun',
                            type=inputs.boolean,
                            required=False,
                            help='Just validate project')
        args = parser.parse_args()

        self.backend = persistence.get_backend(
            self.global_config['config']['app']['backend']['persistence']
            ['type'], self.global_config['config']['app']['backend']
            ['persistence']['config'], self.global_config)

        field_map = {}
        project = {}
        validate_project = {}
        for k, v in api.payload.items():
            if k == 'owners':
                validate_project['owner'] = v[0]
                project[k] = v
            else:
                validate_project[k] = v
                project[k] = v

        validation_warnings = {}
        project_yaml = yaml.dump({'project': validate_project})
        data = yamale.make_data(content=project_yaml)
        try:
            yamale.validate(self.schema, data)
        except yamale.yamale_error.YamaleError as e:
            for result in e.results:
                for error in result.errors:
                    end_field = error.find(':')
                    field_name = error[0:end_field]
                    if field_name[len(field_name) -
                                  1:len(field_name)].isdigit():
                        end_index = field_name.rfind('.')
                        field_name = field_name[0:end_index]
                    validation_warnings[field_name] = {
                        'error':
                            error[end_field + 1:],
                        'help':
                            self.schema_help[field_name]
                            if field_name in self.schema_help else ''
                    }
            logger.warn('Failed validating project',
                        extra={'errors': validation_warnings})
        redirect_url = ''
        if not args.dryRun:
            try:
                ok, redirect_url = self.backend.add_project(
                    api.payload['projectId'], project)
            except Exception as e:
                abort(500, str(e))
        else:
            ok = True if len(validation_warnings.keys()) == 0 else False
        return {
            'ok': bool(ok),
            'redirect_url': redirect_url,
            'errors': validation_warnings
        }


@api.route('/<string:id>')
@api.param('id', 'The project identifier')
@api.response(404, 'Project not found')
class Project(Resource):
    apimodel = {}
    global_config = None

    @api.doc('get_project')
    def get(self, id):
        '''Get a project'''
        self.backend = persistence.get_backend(
            self.global_config['config']['app']['backend']['persistence']
            ['type'], self.global_config['config']['app']['backend']
            ['persistence']['config'], self.global_config)
        try:
            project = self.backend.get_project(id)
            if project:
                return api.marshal(project, self.apimodel)
        except Exception as e:
            abort(500, str(e))

        api.abort(404, "Project {} doesn't exist".format(id))
