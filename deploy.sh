#!/bin/bash

# Auto Commit and Deploy Script
# This script will commit your changes and push to GitHub,
# which will automatically trigger the Docker build and push via GitHub Actions

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Auto Commit and Deploy Script${NC}"
echo "======================================"

# Check if there are any changes
if git diff --quiet && git diff --staged --quiet; then
    echo -e "${YELLOW}⚠️  No changes detected. Nothing to commit.${NC}"
    exit 0
fi

# Get commit message from user or use default
if [ -z "$1" ]; then
    echo -e "${YELLOW}💬 Enter commit message (or press Enter for auto-generated message):${NC}"
    read -r COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="chore: update application - $(date '+%Y-%m-%d %H:%M:%S')"
    fi
else
    COMMIT_MSG="$1"
fi

echo -e "${BLUE}📝 Staging changes...${NC}"
git add .

echo -e "${BLUE}💾 Committing changes...${NC}"
git commit -m "$COMMIT_MSG"

echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
git push origin main

echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"

# Check what type of workflow will run
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)
CODE_CHANGED=false
for file in $CHANGED_FILES; do
    if [[ ! "$file" =~ \.(md|txt)$ ]] && \
       [[ ! "$file" =~ ^docs/ ]] && \
       [[ "$file" != ".gitignore" ]] && \
       [[ "$file" != "LICENSE" ]] && \
       [[ "$file" != "deploy.sh" ]] && \
       [[ "$file" != "deploy.bat" ]]; then
        CODE_CHANGED=true
        break
    fi
done

if [ "$CODE_CHANGED" = true ]; then
    echo -e "${YELLOW}🔄 GitHub Actions will now automatically:${NC}"
    echo "   • Build Docker images"
    echo "   • Push to Docker Hub"
    echo "   • Tag with commit SHA"
else
    echo -e "${YELLOW}📝 Documentation-only changes detected:${NC}"
    echo "   • Will run documentation validation"
    echo "   • Docker builds skipped (saves time and resources)"
    echo "   • Next code commit will trigger Docker builds"
fi

echo ""
echo -e "${BLUE}📊 Monitor progress at:${NC}"
echo "   https://github.com/vinsim24/stock-app/actions"
echo ""
echo -e "${GREEN}🎉 Deployment pipeline started!${NC}"
