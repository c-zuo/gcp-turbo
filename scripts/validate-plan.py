#!/usr/bin/env python3
import argparse
import json
import tempfile
import sys
import os

parser = argparse.ArgumentParser(
    description='Validate a Terraform plan file against deletions.')
parser.add_argument('file', type=str, help='file to validate')
args = parser.parse_args()

with open(args.file, 'rb') as f:
    c = f.read(2)
    if c == b'PK':  # Compressed TF plan file, courtesy of Phil Katz
        temp = tempfile.mkstemp(suffix='.json')
        os.system('terraform show -json %s > %s' % (args.file, temp[1]))
        args.file = temp[1]

with open(args.file) as f:
    plan = json.load(f)
    if 'resource_changes' in plan:
        for change in plan['resource_changes']:
            if 'delete' in change['change']['actions']:
                if change['provider_name'] == 'registry.terraform.io/hashicorp/null':
                    print('(Terraform plan file has a deletion operation, but it\'s only for a null resource, ignoring...)',
                          file=sys.stderr)

                else:
                    print('Terraform plan file has deletion operations.',
                          file=sys.stderr)
                    sys.exit(1)
print('Terraform plan file has only creates and in-place updates.', file=sys.stderr)
sys.exit(0)
