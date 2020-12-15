#!/usr/bin/env python3
import os
import sys
import gitlab
import argparse
import re

if not os.getenv('PYTHON_GITLAB_CFG'):
    print('Please point the environment variable PYTHON_GITLAB_CFG to Gitlab configuration file.\nSee: https://python-gitlab.readthedocs.io/en/stable/cli.html#content', file=sys.stderr)
    sys.exit(1)


parser = argparse.ArgumentParser(
    description='Maintain Gitlab project')
parser.add_argument('namespace', type=str, help='Gitlab namespace')
parser.add_argument('project', type=str, help='Gitlab project name')
parser.add_argument('--maintainers', type=str, nargs='+',
                    help='Maintainers of the project')
parser.add_argument('--developers', type=str, nargs='+',
                    help='Developers of the project')
parser.add_argument('--reporters', type=str, nargs='+',
                    help='Reporters of the project')
parser.add_argument('--guests', type=str, nargs='+',
                    help='Guests of the project')
parser.add_argument('--template_name', type=str, nargs='+',
                    help='Template name (project template)')
args = parser.parse_args()


def add_members(project, existing, members, level):
    existing_users = []
    for m in existing:
        existing_users.append(m.username)
    for member in members:
        m = re.sub(r'@.+', '', member)
        if m not in existing_users:
            user = gl.users.list(username=m)
            if not user or len(user) == 0:
                print('User %s not found, skipping...' %
                      member, file=sys.stderr)
            else:
                print('Adding user %s to project...' %
                      user[0].username, file=sys.stderr)
                project.members.create(
                    {'user_id': user[0].id, 'access_level': level})


project_id = '%s/%s' % (args.namespace, args.project)
gl = gitlab.Gitlab.from_config(None, os.getenv('PYTHON_GITLAB_CFG'))
gl.auth()

namespace_id = None
namespaces = gl.namespaces.list()
for ns in namespaces:
    if ns.full_path == args.namespace:
        namespace_id = ns.id

if not namespace_id:
    print('Did not find a namespace that matches %s.' %
          args.namespace, file=sys.stderr)
    sys.exit(1)

project = None
try:
    project = gl.projects.get(project_id)
except gitlab.exceptions.GitlabGetError as e:
    pass

if not project:
    proj = {'name': args.project, 'namespace_id': namespace_id}
    if args.template_name:
        proj['template_name'] = args.template_name
    gl.projects.create(proj)

    project = None
    try:
        project = gl.projects.get(project_id)
    except gitlab.exceptions.GitlabGetError as e:
        print('Project creation failed for some reason: %s' %
              e, file=sys.stderr)

members = project.members.list()
if args.maintainers:
    add_members(project, members, args.maintainers, gitlab.MAINTAINER_ACCESS)
if args.developers:
    add_members(project, members, args.developers, gitlab.DEVELOPER_ACCESS)
if args.reporters:
    add_members(project, members, args.reporters, gitlab.REPORTER_ACCESS)
if args.guests:
    add_members(project, members, args.guests, gitlab.GUEST_ACCESS)
