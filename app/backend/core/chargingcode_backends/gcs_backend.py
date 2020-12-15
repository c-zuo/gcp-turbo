from core.chargingcode_backend import ChargingCodeBackend
from google.cloud import storage
from google.api_core.gapic_v1 import client_info as grpc_client_info
import io
import json


class GcsChargingCodeBackend(ChargingCodeBackend):
    bucket = None
    object_path = None
    charging_codes = []

    def __init__(self, config, global_config):
        self.bucket = global_config['chargingCodesDestinationBucket']
        self.object_path = global_config['chargingCodesDestinationObject']

    def _read_charging_codes(self):
        if len(self.charging_codes) == 0:
            client_info = grpc_client_info.ClientInfo(
                user_agent='google-pso-tool/turbo-project-factory/1.0.0')
            storage_client = storage.Client(client_info=client_info)
            bucket = storage_client.bucket(self.bucket)
            blob = bucket.blob(self.object_path)
            if blob.exists():
                blob_contents = io.BytesIO()
                storage_client.download_blob_to_file(blob, blob_contents)
                charging_codes = json.loads(
                    blob_contents.getvalue().decode('utf-8'))
                if isinstance(charging_codes, list):
                    for code in charging_codes:
                        self.charging_codes.append({
                            'id': code,
                            'title': code,
                            'description': None,
                            'group': ''
                        })
                else:
                    self.charging_codes = charging_codes

    def get_charging_codes(self):
        self._read_charging_codes()
        return self.charging_codes

    def get_charging_code(self, id):
        _ret = next((item for item in self.charging_codes if item['id'] == id),
                    None)
        return _ret

    def add_charging_code(self, id, name, description):
        pass

    def delete_charging_code(self, id):
        pass
