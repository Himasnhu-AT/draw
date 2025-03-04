#!/bin/bash

# Configuration variables
GITHUB_REPO="Himasnhu-at/draw"
RELEASE_NOTES_FILE="release_notes.md"
DEFAULT_APP_DIR="./src-tauri/target/release/bundle/macos"
# We no longer select an existing DMG.
# DMG will be created from the signed app bundle.
DMG_RELEASE_NAME="draw-RELEASE_VERSION-macos.dmg"  # Will substitute RELEASE_VERSION later.
APP_ZIP="draw-RELEASE_VERSION-macos.zip"             # Will substitute RELEASE_VERSION later.

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}GitHub CLI not found. Please install it first:${NC}"
    echo "  brew install gh  # On macOS"
    echo "Then authenticate with: gh auth login"
    exit 1
fi

echo -e "${BLUE}================ GitHub Release Creator =================${NC}"

# Ask for version number
read -p "Enter release version (e.g., 0.0.0-beta): " VERSION
TAG_NAME="v$VERSION"
RELEASE_TITLE="Draw App $VERSION (macOS)"
# Substitute version into DMG and ZIP names
DMG_RELEASE_NAME=${DMG_RELEASE_NAME/RELEASE_VERSION/$VERSION}
APP_ZIP=${APP_ZIP/RELEASE_VERSION/$VERSION}

# Ask if this is a prerelease
while true; do
    read -p "Is this a pre-release? (y/n): " prerelease_choice
    case $prerelease_choice in
        [Yy]* ) IS_PRERELEASE=true; break;;
        [Nn]* ) IS_PRERELEASE=false; break;;
        * ) echo "Please answer yes or no.";;
    esac
done

# Function to find and let user select files
select_file() {
    local file_type=$1  # "app"
    local default_dir=$2
    local selection_var_name=$3
    local files=()
    local count=0

    echo -e "${BLUE}Searching for $file_type files...${NC}"

    if [ "$file_type" == "app" ]; then
        if [ -d "$default_dir" ]; then
            while IFS= read -r -d $'\0' file; do
                files+=("$file")
                ((count++))
            done < <(find "$default_dir" -maxdepth 2 -name "*.app" -type d -print0)
        fi
    fi

    if [ $count -eq 0 ]; then
        echo -e "${YELLOW}No $file_type files found in $default_dir${NC}"
        read -p "Enter path to your $file_type file: " custom_path

        if [ "$file_type" == "app" ] && [ ! -d "$custom_path" ]; then
            echo -e "${RED}Error: Directory not found at $custom_path${NC}"
            exit 1
        fi

        eval "$selection_var_name=\"$custom_path\""
        return
    fi

    if [ $count -eq 1 ]; then
        echo -e "${GREEN}Found one $file_type file: ${files[0]}${NC}"
        read -p "Use this file? (y/n): " use_file

        if [[ "$use_file" == [Yy]* ]]; then
            eval "$selection_var_name=\"${files[0]}\""
            return
        else
            read -p "Enter path to your $file_type file: " custom_path
            if [ "$file_type" == "app" ] && [ ! -d "$custom_path" ]; then
                echo -e "${RED}Error: Directory not found at $custom_path${NC}"
                exit 1
            fi
            eval "$selection_var_name=\"$custom_path\""
            return
        fi
    fi

    echo -e "${YELLOW}Multiple $file_type files found:${NC}"
    for i in "${!files[@]}"; do
        echo "  [$((i+1))] ${files[$i]}"
    done

    echo "  [0] Enter custom path"

    while true; do
        read -p "Select a file (1-$count, or 0 for custom): " selection
        if [ "$selection" -eq 0 ] 2>/dev/null; then
            read -p "Enter path to your $file_type file: " custom_path
            if [ "$file_type" == "app" ] && [ ! -d "$custom_path" ]; then
                echo -e "${RED}Error: Directory not found at $custom_path${NC}"
                continue
            fi
            eval "$selection_var_name=\"$custom_path\""
            break
        elif [ "$selection" -ge 1 ] 2>/dev/null && [ "$selection" -le $count ]; then
            eval "$selection_var_name=\"${files[$((selection-1))]}\""
            break
        else
            echo -e "${YELLOW}Invalid selection. Please enter a number between 0 and $count.${NC}"
        fi
    done
}

# Find and select app bundle
select_file "app" "$DEFAULT_APP_DIR" "APP_PATH"
echo -e "${GREEN}Selected app bundle: $APP_PATH${NC}"

# Self-sign the app bundle using an ad-hoc signature
echo -e "${BLUE}Self-signing the .app bundle using ad-hoc signature...${NC}"
codesign --deep --force --verify --verbose --sign - "$APP_PATH"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}App bundle signed successfully.${NC}"
else
    echo -e "${RED}Failed to sign app bundle. Check codesign logs above.${NC}"
    exit 1
fi

# Create a new DMG from the signed app bundle
echo -e "${BLUE}Creating DMG from the signed app bundle...${NC}"
hdiutil create -volname "Draw App" -srcfolder "$APP_PATH" -ov -format UDZO "$DMG_RELEASE_NAME"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}DMG created successfully: $DMG_RELEASE_NAME${NC}"
else
    echo -e "${RED}Failed to create DMG.${NC}"
    exit 1
fi

# Compress the .app bundle for upload (if desired)
echo -e "${BLUE}Compressing the .app bundle into a ZIP archive...${NC}"
ditto -c -k --keepParent "$APP_PATH" "$APP_ZIP"
echo -e "${GREEN}Created zip archive: $APP_ZIP${NC}"

# Create git tag if it doesn't exist
if ! git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
    echo -e "${BLUE}Creating git tag $TAG_NAME...${NC}"
    git tag -a "$TAG_NAME" -m "Release $VERSION"

    echo -e "${BLUE}Pushing tag to GitHub...${NC}"
    git push origin "$TAG_NAME"
else
    echo -e "${YELLOW}Tag $TAG_NAME already exists${NC}"
    read -p "Continue with existing tag? (y/n): " continue_choice
    if [[ "$continue_choice" != [Yy]* ]]; then
        echo "Aborting release process."
        rm "$APP_ZIP"
        exit 0
    fi
fi

# Create a template release notes file if it doesn't exist
if [ ! -f "$RELEASE_NOTES_FILE" ]; then
    cat > "$RELEASE_NOTES_FILE" << EOF
# Draw App $VERSION

This is a release version of the Draw App.

$( [[ "$IS_PRERELEASE" = true ]] && echo "**⚠️ IMPORTANT: This release is NOT intended for production use at this time.**" )

## Included in this release:
- macOS application bundle (draw.app)
- macOS DMG installer

## Notes:
- Please add your release notes here
- List any known issues
- Mention any important changes

Thank you for using Draw App!
EOF
fi

echo -e "${BLUE}===============================================================${NC}"
echo "Please edit the release notes in $RELEASE_NOTES_FILE."
echo "A template has been created for you."
echo "When you're finished, save the file and return to this terminal."
echo -e "${BLUE}===============================================================${NC}"

if [ -n "$EDITOR" ]; then
    EDIT_CMD="$EDITOR"
elif command -v nano &> /dev/null; then
    EDIT_CMD="nano"
elif command -v vim &> /dev/null; then
    EDIT_CMD="vim"
elif command -v vi &> /dev/null; then
    EDIT_CMD="vi"
else
    EDIT_CMD=""
fi

if [ -n "$EDIT_CMD" ]; then
    $EDIT_CMD "$RELEASE_NOTES_FILE"
else
    echo -e "${YELLOW}No editor found. Please edit $RELEASE_NOTES_FILE manually with your preferred editor.${NC}"
fi

# Append instructions to the release notes for non-notarized apps
echo -e "\n\n> [!IMPORTANT]\n> ## **Important Note for macOS Users:**" >> "$RELEASE_NOTES_FILE"
echo "> This app is not notarized by Apple, so you may see a warning saying it can’t be opened because Apple cannot check it for malicious software." >> "$RELEASE_NOTES_FILE"
echo "> To open the app:" >> "$RELEASE_NOTES_FILE"
echo ">   1. Control-click (or right-click) the app and choose 'Open'." >> "$RELEASE_NOTES_FILE"
echo ">   2. In the dialog that appears, click 'Open' again." >> "$RELEASE_NOTES_FILE"
echo "> Alternatively, you can open System Settings -> Privacy & Security and click 'Open Anyway' next to the warning." >> "$RELEASE_NOTES_FILE"
echo -e "---\n" >> "$RELEASE_NOTES_FILE"

while true; do
    read -p "Have you finished editing the release notes? (y/n): " yn
    case $yn in
        [Yy]* ) break;;
        [Nn]* ) echo "Please edit $RELEASE_NOTES_FILE before continuing.";;
        * ) echo "Please answer yes or no.";;
    esac
done

echo -e "${BLUE}============= Release Summary =============${NC}"
echo "Version: $VERSION"
echo "Tag: $TAG_NAME"
echo "Title: $RELEASE_TITLE"
echo "Pre-release: $IS_PRERELEASE"
echo "App bundle: $APP_PATH"
echo "DMG file: $DMG_RELEASE_NAME"
echo -e "${BLUE}==========================================${NC}"

read -p "Create GitHub release now? (y/n): " confirm
if [[ "$confirm" != [Yy]* ]]; then
    echo "Release creation cancelled."
    rm "$APP_ZIP"
    exit 0
fi

echo -e "${BLUE}Creating GitHub release...${NC}"
if [ "$IS_PRERELEASE" = true ]; then
    PRERELEASE_FLAG="--prerelease"
else
    PRERELEASE_FLAG=""
fi

gh release create "$TAG_NAME" \
    $PRERELEASE_FLAG \
    --title "$RELEASE_TITLE" \
    --notes-file "$RELEASE_NOTES_FILE" \
    "$APP_ZIP#macOS Application Bundle (ZIP)" \
    "$DMG_RELEASE_NAME#macOS Installer (DMG)"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Release $VERSION created successfully!${NC}"
    echo -e "View your release at: ${BLUE}https://github.com/$GITHUB_REPO/releases/tag/$TAG_NAME${NC}"
else
    echo -e "${RED}❌ Failed to create release. Check the error message above.${NC}"
fi

echo "Cleaning up..."
rm "$APP_ZIP"
rm "$DMG_RELEASE_NAME"

echo -e "${GREEN}Release process completed.${NC}"
