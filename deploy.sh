#!/bin/bash
sed -i '' -e 's/"\/page\//"\/archives\/page\//g' public/index.html

echo "git pull origin gh-pages"
cd .deploy
git pull origin gh-pages
cd -

ls -l .deploy | grep -v '.git' |grep -v 'total ' | awk '{print $9}' |xargs -Ixx rm -rf .deploy/xx
cp -rf public/* .deploy/

echo "git commit and push"

cd .deploy
git add --all
git commit -am "update"
git push origin gh-pages
