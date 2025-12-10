#!/bin/bash
# Update npm for OIDC trusted publishing
# npm trusted publishing requires npm >= 11.5.1
# Node.js 20.x ships with npm 10.x, so we need to update

echo "Current npm version: $(npm --version)"
npm install -g npm@latest
echo "Updated npm version: $(npm --version)"
