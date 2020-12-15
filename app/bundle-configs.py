import argparse
import sys
import yaml

parser = argparse.ArgumentParser(
    description=
    'A helper tool to bundle all frontend and backend configurations into a Secret Manager secret contents.'
)
# Check validity of command line flags
parser.add_argument('--config', help='Location of config.yaml.')
parser.add_argument('--app-config', help='Location of appConfig.yaml.')
parser.add_argument('--schema', help='Location of projectSchema.yaml.')
parser.add_argument('--schema-help', help='Location of projectSchemaHelp.yaml.')
parser.add_argument('--approved-apis',
                    help='Location of projectApprovedApis.yaml.')
args = parser.parse_args()

if not args.config or not args.app_config or not args.schema or not args.schema_help or not args.approved_apis:
    print('Specify location of all configuration files!', file=sys.stderr)
    sys.exit(1)


def merge(a, b, path=None):
    if path is None:
        path = []
    for key in b:
        if key in a:
            if isinstance(a[key], dict) and isinstance(b[key], dict):
                merge(a[key], b[key], path + [str(key)])
            elif a[key] == b[key]:
                pass  # same leaf value
            else:
                raise Exception('Conflict at %s' % '.'.join(path + [str(key)]))
        else:
            a[key] = b[key]
    return a


config = {}
with open(args.config) as f:
    config['config'] = yaml.load(f, Loader=yaml.SafeLoader)

with open(args.app_config) as f:
    app_config = yaml.load(f, Loader=yaml.SafeLoader)
    config['config'] = merge(config['config'], app_config)

with open(args.schema_help) as f:
    config['schemaHelp'] = yaml.load(f, Loader=yaml.SafeLoader)

with open(args.approved_apis) as f:
    config['approvedApis'] = yaml.load(f, Loader=yaml.SafeLoader)

with open(args.schema) as f:
    config['schema'] = f.read()

print(yaml.dump(config))