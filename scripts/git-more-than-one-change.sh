#!/bin/bash

TARGET_BRANCH_NAME=${1:-origin/master}
CHANGED_FILES=$(git log --pretty=format:"" --name-only $TARGET_BRANCH_NAME.. | grep -c '.')
if [ $CHANGED_FILES -gt 1 ] ; then
    >&2 echo "More than 1 file changed by the request."
    exit 1
fi
exit 0

