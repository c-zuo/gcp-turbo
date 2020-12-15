#!/bin/bash

TARGET_BRANCH_NAME=${1:-origin/master}
CHANGED_FILES=$(git log --pretty=format:"" --name-only $TARGET_BRANCH_NAME.. | grep -v '^$')
for file in $CHANGED_FILES
do
    if ! echo $file | grep -q '^projects/' ; then
        >&2 echo "File changed outside of projects directory: $file"
        exit 1
    fi
done
exit 0