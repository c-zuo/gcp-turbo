#!/usr/bin/env python3
from __future__ import print_function

import os

import pprint
import sys
from googleapiclient.discovery import build

if len(sys.argv) < 2:
    print('Usage: python3 group-allow-external-users.py group@email.address', file=sys.stderr)
    sys.exit(1)

groupId = sys.argv[1]
service = build('groupssettings', 'v1')

group = service.groups()
g = group.get(groupUniqueId=groupId).execute()

body = {
    'allowExternalMembers': True
}
group.update(groupUniqueId=groupId, body=body).execute()
print('Group %s now allowed to have external members, enjoy.' % groupId)
