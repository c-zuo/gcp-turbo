"""A tool for adding projects to Stackdriver accounts.

A script that creates a Stackdriver account, adds a monitored project to the
newly created Stackdriver account and finally fetches and displays the
Stackdriver account.

Please ensure that you pip install the requirements in 'requirements.txt'.
"""
# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation
# for any use or purpose. Your use of it is subject to your agreement with Google.

import argparse
import pprint
import sys
import time
import os
import logging
import json

from googleapiclient.discovery import build
import googleapiclient.errors as errors
from oauth2client import tools
from oauth2client.client import flow_from_clientsecrets
from oauth2client.file import Storage
from google.oauth2 import service_account

MONITORING_SCOPE = 'https://www.googleapis.com/auth/monitoring'
API_SERVICE_NAME = 'stackdriver'
API_VERSION = 'v2'
URI = 'https://stackdriver.googleapis.com/$discovery/rest?labels=ACCOUNTS_TRUSTED_TESTER&version=v2&key='
pp = pprint.PrettyPrinter(indent=2)


def generate_account_name(host_project_id):
    """Convert the host project id into a Stackdriver account name.

    Args:
      host_project_id: Host project id.

    Returns:
      Stackdriver account name
    """
    return 'accounts/' + host_project_id


def generate_monitored_project_name(host_project_id, monitored_project_id):
    """Convert host and monitored project ids into a monitored project name.

    Args:
      host_project_id: Host project id
      monitored_project_id: Monitored project id

    Returns:
      monitored project name
    """
    return 'accounts/' + host_project_id + '/projects/' + monitored_project_id


def get_authenticated_service_using_service_account(api_key,
                                                    service_account_file,
                                                    quota_project=None):
    """Get an authenticated Stackdriver account service using a client secret.

    Args:
      api_key: API Key to use for Discovery Doc.
      oauth_client_secrets: OAuth2 Client Secrets JSON file path.
      quota_project: Quota project ID (optional).

    Returns:
      Authenticated Accounts API client.
    """

    if service_account_file:
        credentials = service_account.Credentials.from_service_account_file(
            service_account_file,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
            quota_project_id=quota_project
        )
    else:
        credentials = None
    return build(
        API_SERVICE_NAME,
        API_VERSION,
        credentials=credentials,
        discoveryServiceUrl=URI + api_key)


def get_stackdriver_account(service, host_project_id, include_projects=False):
    """Fetch a Stackdriver account given the host project id.

    Args:
      service: An authenticated Stackdriver account service
      host_project_id: Host project id.
      include_projects: Include monitored project

    Returns:
      A Stackdriver account.
    """
    results = service.accounts().get(
        name=generate_account_name(host_project_id),
        includeProjects=include_projects).execute()
    pp.pprint(results)
    return results


def create_stackdriver_account(service, host_project_id):
    """Create a new Stackdriver account.

    Args:
      service: An authenticated Stackdriver account service
      host_project_id: Host project id.

    Returns:
      A long running process
    """
    account = {
        'name': generate_account_name(host_project_id),
    }
    long_running_op = service.accounts().create(body=account).execute()
    pp.pprint(long_running_op)
    return long_running_op


def create_monitored_project(service, host_project_id, monitored_project_id, no_ignore_existing):
    """Create a new monitored project.

    Args:
      service: An authenticated Stackdriver account service
      host_project_id: Host project id.
      monitored_project_id: Monitored project id
      no_ignore_existing: Whether to not ignore already exist errors.

    Returns:
      A long running process
    """
    parent = generate_account_name(host_project_id)
    monitored_project = {
        'name':
            generate_monitored_project_name(host_project_id,
                                            monitored_project_id),
        'project_id':
            monitored_project_id,
    }
    try:
        long_running_op = service.accounts().projects().create(
            parent=parent, body=monitored_project).execute()
        pp.pprint(long_running_op)
        return long_running_op
    except errors.HttpError as e:
        if not no_ignore_existing and 'already exists' in str(e):
            return
        raise e


def long_running_operation_poller(service, operation_name):
    """A long running operation poller that polls every 5 seconds till operation.

    completion.

    Args:
      service: An authenticated Stackdriver account service
      operation_name: An operation name identifying a create operation.
    """
    operation = service.operations().get(name=operation_name).execute()
    while not operation.get('done', False):
        time.sleep(5)
        operation = service.operations().get(name=operation_name).execute()
        pp.pprint(operation)


def main():
    # Setup command line flags
    parser = argparse.ArgumentParser(
        description='Stackdriver Accounts API example tool.')
    parser.add_argument(
        '--api-key',
        default=os.getenv('SD_API_KEY'),
        help='API key to call Stackdriver Accounts API with.')
    parser.add_argument(
        '--service-account',
        help='Service account credentials in JSON (if on GCE, automatically picked up from instance).')
    parser.add_argument(
        'project_id',
        help='Project to add to existing or create new Stackdriver Account.')
    parser.add_argument(
        '--create-new-account',
        default=False,
        action='store_true',
        help='If True, new account will be created for the project.')
    parser.add_argument(
        '--no-ignore-existing',
        default=False,
        action='store_true',
        help='If set, errors about project already existing in an account are not ignored.')
    parser.add_argument(
        '--host-project-id',
        help='Host Project for Stackdriver Account to add project to.')
    parser.add_argument(
        '--quota-project-id',
        help='Quota project ID (optional).')

    # Check validity of command line flags
    args = parser.parse_args()
    if not args.create_new_account and not args.host_project_id:
        raise RuntimeError('Must provide host-project-id if not creating '
                           'a new Stackdriver Account.')
    if not args.api_key:
        raise RuntimeError('Must provide API key.')
    if not args.service_account and os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        args.service_account = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

    # Clear commandline flags so they don't mess up OAuth flow
    sys.argv = [sys.argv[0]]

    # Generate authenticated Stackdriver Accounts API client
    service = get_authenticated_service_using_service_account(
        args.api_key, args.service_account, quota_project=args.quota_project_id)

    # Create new Stackdriver Account or add project existing Stackdriver Account
    if args.create_new_account:
        op = create_stackdriver_account(service, args.project_id)
        long_running_operation_poller(service, op['name'])
        get_stackdriver_account(
            service, args.project_id, include_projects=True)
    else:
        try:
            op = create_monitored_project(service, args.host_project_id,
                                          args.project_id, args.no_ignore_existing)
            if op:
                long_running_operation_poller(service, op['name'])
            get_stackdriver_account(
                service, args.host_project_id, include_projects=True)
        except errors.HttpError as e:
            print('Failed to add project (HttpError): %s' % str(e.content))


if __name__ == '__main__':
    main()
