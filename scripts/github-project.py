#!/usr/bin/env python3
import os
import sys
from github import Github, GithubException
import argparse
import re

if not os.getenv('GITHUB_TOKEN'):
    print('Environment variable GITHUB_TOKEN is not set.', file=sys.stderr)
    sys.exit(1)


parser = argparse.ArgumentParser(
    description='Maintain Github project')
parser.add_argument('--organization', type=str,
                    nargs=1, help='Github organization')
parser.add_argument('repository', type=str, help='Github repository name')
parser.add_argument('--pull', type=str, nargs='+',
                    help='Users that can pull from the repository')
parser.add_argument('--push', type=str, nargs='+',
                    help='Users that can push to the repository')
parser.add_argument('--admin', type=str, nargs='+',
                    help='Admins of the repository')
args = parser.parse_args()


def add_members(repository, existing, members, level):
    existing_users = []
    for m in existing:
        existing_users.append(m.login)
    for m in members:
        if m not in existing_users:
            repository.add_to_collaborators(m, permission=level)


g = Github(os.getenv('GITHUB_TOKEN'))
user = g.get_user()
org = None
if args.organization:
    org = g.get_organization(args.namespace)
    namespace = org.login
else:
    namespace = user.login

repository_id = '%s/%s' % (namespace, args.repository)
try:
    repo = g.get_repo(repository_id)
except Exception as e:
    if not org:
        repo = user.create_repo(args.repository, private=True)
    else:
        org.create_repo(args.repository, private=True)

repository_id = '%s/%s' % (namespace, args.repository)
try:
    repo = g.get_repo(repository_id)
    collaborators = repo.get_collaborators()
    if args.pull:
        add_members(repo, collaborators, args.pull, "pull")
    if args.push:
        add_members(repo, collaborators, args.pull, "push")
    if args.admin:
        add_members(repo, collaborators, args.pull, "admin")
except Exception as e:
    print('Failed getting the repository %s' % repository_id, file=sys.stderr)
    sys.exit(1)
