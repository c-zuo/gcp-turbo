#!/usr/bin/env python3
"""A tool for managing Essential Contacts.
Requirements in 'requirements.txt'.
"""
# Copyright 2020 Google LLC. This software is provided as-is, without warranty or representation
# for any use or purpose. Your use of it is subject to your agreement with Google.

import google.auth
import googleapiclient.errors as errors
from googleapiclient.discovery import build
from google.oauth2 import service_account
import argparse
import pprint
import os
import sys

API_SERVICE_NAME = 'essentialcontacts'
API_VERSION = 'v1alpha1'
URI = 'https://essentialcontacts.googleapis.com/$discovery/rest?key='
pp = pprint.PrettyPrinter(indent=2)

parser = argparse.ArgumentParser(
    description='Essential Contacts API example tool.')
parser.add_argument('--api-key',
                    default=os.getenv('EC_API_KEY'),
                    help='Service account key file.')
parser.add_argument('--service-account-file',
                    default=os.getenv('GOOGLE_APPLICATION_CREDENTIALS'),
                    help='API key to call Essential Contacts API with.')
parser.add_argument('project_id',
                    help='Project to set the essential contacts for.')
parser.add_argument('--categories',
                    nargs='+',
                    default='ALL',
                    choices=[
                        'NOTIFICATION_CATEGORY_UNSPECIFIED', 'OTHER', 'ALL',
                        'SUSPENSION', 'PRIVACY', 'SECURITY', 'TECHNICAL',
                        'BILLING', 'LEGAL', 'PRODUCT_UPDATES'
                    ],
                    help='Set the category for notifications.')
parser.add_argument('--contacts', help='Set the contacts for the category.')
parser.add_argument('--quota-project-id',
                    default=None,
                    help='Quota project ID (optional).')

# Check validity of command line flags
args = parser.parse_args()
if not args.api_key:
    raise RuntimeError('Must provide API key.')

if args.service_account_file:
    credentials = service_account.Credentials.from_service_account_file(
        args.service_account_file,
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
        quota_project_id=args.quota_project_id)
else:
    credentials, project = google.auth.default(
        quota_project_id=args.quota_project_id)

service = build(API_SERVICE_NAME,
                API_VERSION,
                developerKey=args.api_key,
                credentials=credentials,
                discoveryServiceUrl=URI + args.api_key)

project_id = 'projects/%s' % args.project_id
contacts = service.projects().contacts().list(parent=project_id).execute()
contacts_to_set = args.contacts.split(',')
# List and remove existing contacts that don't match the list
if 'contacts' in contacts:
    for contact in contacts['contacts']:
        if contact['email'] not in contacts_to_set:
            print('Removing %s from essential contacts.' % (contact['email']),
                  file=sys.stderr)
            delete_contact = service.projects().contacts().delete(
                name=contact['name']).execute()
        else:
            print('Updating %s in essential contacts to categories: %s' %
                  (contact['email'], ','.join(args.categories)),
                  file=sys.stderr)
            update_contact = service.projects().contacts().patch(
                name=contact['name'],
                updateMask='notificationCategorySubscriptions',
                body={
                    'notificationCategorySubscriptions': args.categories
                }).execute()
            contacts_to_set.remove(contact['email'])

for email in contacts_to_set:
    print('Adding %s to essential contacts for categories: %s' %
          (email, ','.join(args.categories)),
          file=sys.stderr)
    new_contact = service.projects().contacts().create(
        parent=project_id,
        body={
            'email': email,
            'languageTag': 'en',
            'notificationCategorySubscriptions': args.categories
        }).execute()
