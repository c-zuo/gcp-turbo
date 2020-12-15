#!/usr/bin/env python3
import yaml
import yamale
import datetime
import sys
import argparse
from validators import get_validators

parser = argparse.ArgumentParser(
    description='Validate a project YAML configuration file.')
parser.add_argument('file', type=str, help='file to validate')
parser.add_argument('--schema',
                    type=str,
                    default='../projectSchema.yaml',
                    help='schema file')
parser.add_argument('--schema-help',
                    type=str,
                    default='../projectSchemaHelp.yaml',
                    help='schema help file')
parser.add_argument('--mode',
                    type=str,
                    default='validate',
                    help='select mode (validate or approve)')
args = parser.parse_args()

schema_help = {}
with open(args.schema_help) as f:
    schema_help = yaml.load(f, Loader=yaml.SafeLoader)

schema_help_key = 'help' if args.mode == 'validate' else 'approvalHelp'

validators = get_validators()
schema = yamale.make_schema(args.schema, validators=validators)
data = yamale.make_data(args.file)
try:
    yamale.validate(schema, data)
except yamale.yamale_error.YamaleError as e:
    print('Error validating data in \'%s\'\n' % args.file, file=sys.stderr)
    for result in e.results:
        for error in result.errors:
            end_field = error.find(':')
            field_name = error[0:end_field]
            if field_name[len(field_name) - 1:len(field_name)].isdigit():
                end_index = field_name.rfind('.')
                field_name = field_name[0:end_index]
            print('  %s' % error, file=sys.stderr)
            if field_name in schema_help[schema_help_key]:
                print('', file=sys.stderr)
                for line in schema_help[schema_help_key][field_name].split(
                        "\n"):
                    print('    %s' % line, file=sys.stderr)
    sys.exit(1)
sys.exit(0)
