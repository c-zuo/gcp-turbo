from google.cloud.iam_credentials_v1 import IAMCredentialsClient


def get_access_token_for_scopes(config, scopes):
    client = IAMCredentialsClient()
    name = 'projects/-/serviceAccounts/%s' % config['config']['app']['backend'][
        'serviceAccount']
    response = client.generate_access_token(name=name, scope=scopes)
    return response.access_token
