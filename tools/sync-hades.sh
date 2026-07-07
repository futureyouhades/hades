#!/bin/bash

echo "=================================="
echo "      HADES PROJECT SYNC"
echo "=================================="

cd /opt/hades || exit 1

echo
echo "Git status:"
git status

echo
read -p "Commit message: " MESSAGE

git add .

git commit -m "$MESSAGE"

git push

echo
echo "Creating source archive..."

tar --exclude=node_modules \
    --exclude=dist \
    --exclude=.git \
    -czf hades-src.tar.gz src package.json package-lock.json tsconfig.json .gitignore

echo
echo "Done."
echo "Archive:"
echo "/opt/hades/hades-src.tar.gz"
