#!/usr/bin/env python3
import yaml
import argparse
import sys
from deepdiff import DeepDiff

parser = argparse.ArgumentParser(
    description='Validate field changes in YAML files')
parser.add_argument('original', type=str, help='Original project file')
parser.add_argument('new', type=str, help='New project file')
parser.add_argument('--schema', type=str, nargs=1, default=['../projectSchemaHoldApproval.yaml'],
                    help='Schema file')
args = parser.parse_args()


def iterate_schema(schema, out, parent):
    for k, v in schema.items():
        if isinstance(v, dict):
            _parent = ('%s.' % parent) if parent != '' else parent
            iterate_schema(v, out, '%s%s' % (_parent, k))
        else:
            out['%s.%s' % (parent, k)] = v


hold_for_approval = False
with open(args.schema[0]) as schema_file:
    schema = yaml.load(schema_file, Loader=yaml.SafeLoader)
    schema_out = {}
    iterate_schema(schema, schema_out, '')

    with open(args.original) as old_file:
        old = yaml.load(old_file, Loader=yaml.SafeLoader)

        with open(args.new) as new_file:
            new = yaml.load(new_file, Loader=yaml.SafeLoader)

            ddiff = DeepDiff(old, new, ignore_order=True)
            if 'values_changed' in ddiff:
                for changed, value in ddiff['values_changed'].items():
                    changed = changed.replace(
                        'root[\'', '').replace('\'][\'', '.').replace('\']', '')
                    if changed in schema_out:
                        if schema_out[changed]:
                            print(
                                'Field %s was changed (%s -> %s), holding for manual approval.' % (changed, value['old_value'], value['new_value']), file=sys.stderr)
                            hold_for_approval = True
                        else:
                            print(
                                'Field %s was changed, but it was automatically approved.' % changed, file=sys.stderr)
            else:
                print('No fields were changed.', file=sys.stderr)


if hold_for_approval:
    print('Result: Holding change for manual approval.', file=sys.stderr)
    sys.exit(1)
sys.exit(0)
