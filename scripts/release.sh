#!/bin/bash

# Release Management Script
# Usage: ./scripts/release.sh [version] [type]
# Example: ./scripts/release.sh 1.2.0 minor

set -e

VERSION=${1:-}
TYPE=${2:-patch}

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version> [type]"
    echo "Example: $0 1.2.0 minor"
    exit 1
fi

echo "🚀 Preparing release v$VERSION..."

# Check if CHANGELOG.md exists
if [ ! -f "CHANGELOG.md" ]; then
    echo "❌ CHANGELOG.md not found!"
    exit 1
fi

# Check if there are changes in [Unreleased] section
if ! grep -A 10 "## \[Unreleased\]" CHANGELOG.md | grep -q "###"; then
    echo "⚠️  Warning: No changes found in [Unreleased] section"
    echo "   Make sure to add your changes to CHANGELOG.md first"
fi

# Update CHANGELOG.md
echo "📝 Updating CHANGELOG.md..."

# Create temporary file
TEMP_FILE=$(mktemp)

# Process CHANGELOG.md
awk -v version="$VERSION" -v today="$(date +%Y-%m-%d)" '
/^## \[Unreleased\]/ {
    print "## [" version "] - " today
    next
}
/^## \[[0-9]/ {
    if (!printed) {
        print "## [Unreleased]"
        print ""
        printed = 1
    }
}
{ print }
' CHANGELOG.md > "$TEMP_FILE"

# Replace original file
mv "$TEMP_FILE" CHANGELOG.md

echo "✅ CHANGELOG.md updated"

# Stage changes
git add CHANGELOG.md

# Check if GPG signing is available
if gpg --list-keys B5690EEEBB952194 >/dev/null 2>&1; then
    echo "🔐 Using GPG signing for commits and tags"
    # Commit changes with GPG signing
    git commit -m "chore: prepare release v$VERSION"
    
    # Create and push tag with GPG signing
    echo "🏷️  Creating signed tag v$VERSION..."
    git tag -a "v$VERSION" -m "Release v$VERSION"
else
    echo "⚠️  GPG signing not available, using unsigned commits"
    # Commit changes (without GPG signing)
    git commit --no-gpg-sign -m "chore: prepare release v$VERSION"
    
    # Create and push tag (without GPG signing)
    echo "🏷️  Creating unsigned tag v$VERSION..."
    git tag --no-sign "v$VERSION" -m "Release v$VERSION"
fi

# Push changes and tag
echo "📤 Pushing changes and tag..."
git push origin main
git push origin "v$VERSION"

echo "🎉 Release v$VERSION prepared!"
echo ""
echo "Next steps:"
echo "1. Review the changes in CHANGELOG.md"
echo "2. GitHub Actions will automatically create the release"
echo "3. Or manually create release at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/')/releases/new"
echo ""
echo "Release URL: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/')/releases/tag/v$VERSION" 