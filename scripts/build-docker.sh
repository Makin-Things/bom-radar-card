#!/bin/bash
# Build the card using Docker (isolates Node.js/npm for security)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

echo "🐳 Building card using Docker (isolated environment)..."

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Error: docker not found"
    echo "   Install Docker or use: npm run build"
    exit 1
fi

# New build path for integration
CARD_BUILD_DIR="custom_components/bom_radar/www"
CARD_BUILD_PATH="$CARD_BUILD_DIR/bom-radar-card.js"

# Ensure build directory exists
mkdir -p "$CARD_BUILD_DIR"

# Build the image
echo "📦 Building Docker image..."
# Use --no-cache if FORCE_REBUILD is set, or if config files changed recently
FORCE_REBUILD="${FORCE_REBUILD:-0}"
if [ "$FORCE_REBUILD" = "1" ]; then
    echo "   Force rebuild (no cache)..."
    docker build --no-cache -f Dockerfile.build -t bom-radar-card-builder .
else
    # Check if config files are newer than the image
    # This ensures we rebuild when tsconfig.json, rollup.config.js, or package.json change
    docker build -f Dockerfile.build -t bom-radar-card-builder .
fi

# Run the build container and copy file out
echo "🔨 Running build..."
# Pass NODE_ENV through to the container if set
ENV_ARGS=""
if [ -n "$NODE_ENV" ]; then
    echo "   Setting NODE_ENV=$NODE_ENV"
    ENV_ARGS="-e NODE_ENV=$NODE_ENV"
fi

# Run the container (using volume for the integration www folder to get the output)
# We map the radar integration www folder to the expected path in the container
docker run --rm $ENV_ARGS -v "$(pwd)/$CARD_BUILD_DIR:/build/$CARD_BUILD_DIR" bom-radar-card-builder

# Check if build succeeded
if [ ! -f "$CARD_BUILD_PATH" ]; then
    echo "❌ Error: Build failed - $CARD_BUILD_PATH not found"
    exit 1
fi

FILE_SIZE=$(stat -f%z "$CARD_BUILD_PATH" 2>/dev/null || stat -c%s "$CARD_BUILD_PATH" 2>/dev/null || echo "0")
echo "✅ Build complete (${FILE_SIZE} bytes)"