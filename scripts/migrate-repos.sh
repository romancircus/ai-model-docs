#!/bin/bash

# =============================================================================
# AI Model Docs - Submodule Migration Script
# =============================================================================
#
# This script adds ai-model-docs as a git submodule to all relevant repos.
#
# PREREQUISITES:
# 1. Create GitHub repo: gh repo create RomanCircus/ai-model-docs --public
# 2. Push ai-model-docs: git push -u origin main
# 3. Run this script from ai-model-docs directory
#
# =============================================================================

set -e

# Configuration
GITHUB_ORG="RomanCircus"
REPO_NAME="ai-model-docs"
GITHUB_URL="git@github.com:${GITHUB_ORG}/${REPO_NAME}.git"
SUBMODULE_PATH="docs/ai-models"
BASE_DIR="/Users/jigyoung/Dropbox/RomanCircus_Apps"

# Repos to migrate (based on AI model usage analysis)
REPOS=(
  "KDH-Automation"
  "NanoBanana-CLI"
  "pullo-v3"
  "VidrushPipeline"
  "PostProduction"
  "YoutubeGodMode"
  "Chatkut"
  "VidrushGodMode"
  "openart_cli"
  "proxys"
  "pokedex-generator"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "  AI Model Docs - Submodule Migration"
echo "=============================================="
echo ""

# Check if GitHub repo exists
echo -e "${YELLOW}Checking if GitHub repo exists...${NC}"
if ! git ls-remote "$GITHUB_URL" &>/dev/null; then
  echo -e "${RED}ERROR: GitHub repo not found at $GITHUB_URL${NC}"
  echo ""
  echo "Please create the repo first:"
  echo "  cd $BASE_DIR/ai-model-docs"
  echo "  gh repo create $GITHUB_ORG/$REPO_NAME --public --source=. --push"
  echo ""
  exit 1
fi
echo -e "${GREEN}GitHub repo found!${NC}"
echo ""

# Process each repo
for REPO in "${REPOS[@]}"; do
  REPO_PATH="$BASE_DIR/$REPO"

  echo "--------------------------------------------"
  echo "Processing: $REPO"
  echo "--------------------------------------------"

  # Check if repo exists
  if [ ! -d "$REPO_PATH" ]; then
    echo -e "${YELLOW}SKIP: Directory not found${NC}"
    continue
  fi

  # Check if it's a git repo
  if [ ! -d "$REPO_PATH/.git" ]; then
    echo -e "${YELLOW}SKIP: Not a git repository${NC}"
    continue
  fi

  cd "$REPO_PATH"

  # Check if submodule already exists
  if [ -d "$SUBMODULE_PATH" ]; then
    echo -e "${YELLOW}SKIP: Submodule already exists${NC}"
    continue
  fi

  # Add submodule
  echo "Adding submodule..."
  git submodule add "$GITHUB_URL" "$SUBMODULE_PATH"

  # Commit
  echo "Committing..."
  git add .gitmodules "$SUBMODULE_PATH"
  git commit -m "feat: Add ai-model-docs submodule

Adds canonical AI model documentation as git submodule at docs/ai-models/

Contents:
- gemini/Get_Started_Nano_Banana.ipynb (Image generation)
- gemini/Get_started_Veo.ipynb (Video generation)
- kling/Get_Started_Kling.md (Video via FAL.ai)

To update: git submodule update --remote

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

  echo -e "${GREEN}SUCCESS: Submodule added to $REPO${NC}"
  echo ""
done

echo "=============================================="
echo "  Migration Complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Review changes in each repo"
echo "2. Push to remote: git push"
echo "3. Update CLAUDE.md in each repo to reference docs/ai-models/"
echo ""
echo "For wife to clone with submodules:"
echo "  git clone --recurse-submodules <repo-url>"
echo ""
