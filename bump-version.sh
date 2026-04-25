#!/usr/bin/env bash
# bump-version.sh — update game version and commit
# Usage: ./bump-version.sh [major|minor|patch] (default: patch)
set -euo pipefail

VERSION_FILE="src/version.js"

# Read current version
current=$(grep -oP "VERSION = '\K[^']+" "$VERSION_FILE")
IFS='.' read -r major minor patch <<< "$current"

# Determine bump type
bump="${1:-patch}"
case "$bump" in
    major) major=$((major + 1)); minor=0; patch=0 ;;
    minor) minor=$((minor + 1)); patch=0 ;;
    patch) patch=$((patch + 1)) ;;
    *) echo "Usage: $0 [major|minor|patch]"; exit 1 ;;
esac

new_version="$major.$minor.$patch"

# Update version file
sed -i "s/VERSION = '.*'/VERSION = '$new_version'/" "$VERSION_FILE"

echo "Version bumped: $current → $new_version"
echo "Review the change, then: git add $VERSION_FILE && git commit -m \"chore: bump version to $new_version\""