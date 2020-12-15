#!/bin/bash

SOURCE_BRANCH_NAME=${1:-origin/master}
TARGET_BRANCH_NAME=${2:-HEAD}
CURRENT_BRANCH=$(git rev-parse HEAD)

>&2 echo "Source branch name: $SOURCE_BRANCH_NAME"
>&2 echo "Target branch name: $TARGET_BRANCH_NAME"
>&2 echo "Current branch: $CURRENT_BRANCH"

PARENT_MERGE_BASE=$(git log --pretty=%P -n 1 $MERGE_BASE)
MERGE_BASE=$(git merge-base $TARGET_BRANCH_NAME $SOURCE_BRANCH_NAME)
>&2 echo "Merge base: $MERGE_BASE"
>&2 echo "Parent merge base: $PARENT_MERGE_BASE"

CHANGED_FILES=$(git diff --name-only $MERGE_BASE..$SOURCE_BRANCH_NAME)

>&2 echo "Checking out the merge base ($MERGE_BASE)..."
TEMP_DIR=$(mktemp -d)
git checkout $MERGE_BASE
for file in $CHANGED_FILES
do
    if [ -f $file ] ; then
        DIR=$(dirname "$file")
        if [ "$DIR" != "." ] ; then
            mkdir -p "$TEMP_DIR/$DIR"
        fi
        cp -f "$file" "$TEMP_DIR/$file" || true
    fi
done

>&2 echo "Checking out the current branch ($CURRENT_BRANCH)..."
>&2 echo "Showing the changes:"

git checkout $TARGET_BRANCH_NAME
output=""
for file in $CHANGED_FILES
do
    if [ -f $TEMP_DIR/$file ] ; then
        output+="$file $TEMP_DIR/$file\n"
        diff -urN "$TEMP_DIR/$file" "$file" 1>&2
    else
        output+="$file\n"
    fi
done
git checkout $CURRENT_BRANCH
echo -ne $output
exit 0