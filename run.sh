#!/bin/bash
# Main entry point - works with or without npm
# Usage: ./run.sh [build|test|clean] [docker|npm] [prod]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMMAND="${1:-test}"
BUILD_METHOD="${2:-}"
BUILD_TARGET="${3:-}"

# Build function - handles both npm and Docker
build_card() {
    local method="$1"
    local target="$2"

    # Auto-detect if not specified
    if [ -z "$method" ] || [ "$method" = "prod" ]; then
        # If the second arg was "prod", treat it as the target and auto-detect method
        if [ "$method" = "prod" ]; then
            target="prod"
        fi

        if command -v docker &> /dev/null; then
            method="docker"
        elif command -v npm &> /dev/null; then
            method="npm"
        else
            echo "❌ Error: Neither Docker nor npm found"
            echo "   Please install Docker or Node.js/npm"
            exit 1
        fi
    fi

    # Set target for production builds
    local target_env=""
    if [ "$target" = "prod" ]; then
        target_env="production"
    fi

    if [ "$method" = "docker" ]; then
        echo "🐳 Building with Docker ($target)..."
        if ! command -v docker &> /dev/null; then
            echo "❌ Error: docker not found"
            exit 1
        fi
        # Pass FORCE_REBUILD if set
        FORCE_REBUILD="${FORCE_REBUILD:-0}" NODE_ENV="$target_env" bash scripts/build-docker.sh
    else
        echo "🔨 Building with npm ($target)..."
        if ! command -v npm &> /dev/null; then
            echo "❌ Error: npm not found"
            echo "   Install Node.js/npm or use: ./run.sh build docker"
            exit 1
        fi

        if [ ! -d "node_modules" ]; then
            echo "📦 Installing dependencies..."
            # Ensure devDependencies are installed even if we're building for prod
            # because we need rollup/plugins to build.
            npm install
        fi

        NODE_ENV="$target_env" npm run build
    fi
}

# Clean function - full cleanup without sudo
clean_test() {
    echo "🧹 Cleaning test environment..."

    # Determine compose files to use
    COMPOSE_FILES="-f docker-compose.test.yml"
    if [ -f "docker-compose.test.local.yml" ]; then
        COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.test.local.yml"
    fi

    # Stop and remove containers with volumes
    echo "   Stopping and removing containers..."
    docker compose $COMPOSE_FILES down -v 2>/dev/null || \
    docker-compose $COMPOSE_FILES down -v 2>/dev/null || true

    # Remove override file
    rm -f docker-compose.test.local.yml

    # Clean up .storage directory using Docker (no sudo needed)
    if [ -d "test-ha/config/.storage" ]; then
        echo "   Removing .storage directory..."
        CURRENT_UID=$(id -u)
        CURRENT_GID=$(id -g)
        if ! rm -rf test-ha/config/.storage 2>/dev/null; then
            # Use Docker to remove root-owned files
            docker run --rm \
                -v "$(pwd)/test-ha/config:/config:rw" \
                -u root \
                alpine:latest \
                sh -c "rm -rf /config/.storage" 2>/dev/null || true
        fi
        echo "   ✅ Cleared .storage directory"
    fi

    # Clean up www directory files (wiping all old card versions)
    echo "   Cleaning www directory..."
    if [ -d "test-ha/config/www" ]; then
        docker run --rm \
            -v "$(pwd)/test-ha/config/www:/www:rw" \
            -u root \
            alpine:latest \
            sh -c "rm -rf /www/*" 2>/dev/null || true
    fi

    # Clean up custom_components directory (wiping all old integration versions)
    echo "   Cleaning custom_components..."
    if [ -d "test-ha/config/custom_components" ]; then
        docker run --rm \
            -v "$(pwd)/test-ha/config/custom_components:/components:rw" \
            -u root \
            alpine:latest \
            sh -c "rm -rf /components/*" 2>/dev/null || true
    fi

    # Clean up cache directory (persisted between redeploys, but removed on full clean)
    if [ -d "test-ha/cache" ]; then
        echo "   Removing cache directory..."
        if ! rm -rf test-ha/cache 2>/dev/null; then
            # Use Docker to remove root-owned files
            docker run --rm \
                -v "$(pwd)/test-ha/cache:/cache:rw" \
                -u root \
                alpine:latest \
                sh -c "rm -rf /cache/*" 2>/dev/null || true
        fi
        echo "   ✅ Cleared cache directory"
    fi

    # Optionally clean build artifacts
    if [ "${CLEAN_BUILD:-0}" = "1" ]; then
        echo "   Removing build artifacts..."
        rm -rf dist/ node_modules/ 2>/dev/null || true
    fi

    echo ""
    echo "✅ Cleanup complete. Run './run.sh test' to start fresh."
}

# Stop function - stops containers without removing data
stop_test() {
    echo "🛑 Stopping test environment (preserving cache and data)..."

    # Determine compose files to use
    COMPOSE_FILES="-f docker-compose.test.yml"
    if [ -f "docker-compose.test.local.yml" ]; then
        COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.test.local.yml"
    fi

    # Stop containers (preserve volumes to keep cache)
    if docker compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        echo "❌ Error: docker compose not found"
        exit 1
    fi

    if $DOCKER_COMPOSE_CMD $COMPOSE_FILES down 2>/dev/null; then
        echo "✅ Test environment stopped (cache and data preserved)"
    else
        echo "⚠️  No running containers found or error stopping containers"
    fi
}

# Update function - rebuilds card and updates running test environment
update_card() {
    local method="$1"

    echo "🔄 Rebuilding and updating card in running test environment..."

    # Always force rebuild when updating to ensure changes are picked up
    if [ -z "$method" ]; then
        if command -v docker &> /dev/null; then
            method="docker"
        elif command -v npm &> /dev/null; then
            method="npm"
        fi
    fi

    # Force rebuild
    if [ "$method" = "docker" ]; then
        FORCE_REBUILD=1 bash scripts/build-docker.sh
    else
        npm run build
    fi

    # Update card in running environment (test.sh auto-detects running containers)
    ./scripts/test.sh
}

case "$COMMAND" in
    build)
        build_card "$BUILD_METHOD" "$BUILD_TARGET"
        ;;
    test)
        ./scripts/test.sh
        ;;
    stop)
        stop_test
        ;;
    update)
        update_card "$BUILD_METHOD"
        ;;
    clean)
        clean_test
        ;;
    *)
        echo "Usage: ./run.sh [COMMAND] [BUILD_METHOD]"
        echo ""
        echo "Commands:"
        echo "  build [docker|npm]  - Build the card (auto-detects method if not specified)"
        echo "  test                - Build and start test Home Assistant environment"
        echo "  stop                - Stop test environment (preserves cache and data)"
        echo "  update [docker|npm] - Rebuild card and update running test environment"
        echo "                        (preserves HA state, auto-detects if containers running)"
        echo "  clean               - Clean test environment (stops containers, removes data)"
        echo ""
        echo "Build Methods:"
        echo "  docker              - Use Docker to build (isolated, no local Node.js needed)"
        echo "  npm                 - Use local npm/Node.js to build"
        echo ""
        echo "Examples:"
        echo "  ./run.sh build          # Auto-detect: Docker (preferred) or npm"
        echo "  ./run.sh build docker   # Force Docker build"
        echo "  ./run.sh test           # Build and start test environment"
        echo "  ./run.sh stop           # Stop test environment (preserves cache)"
        echo "  ./run.sh update         # Rebuild and update running environment"
        echo "  ./run.sh clean          # Clean test environment (removes everything)"
        echo ""
        echo "Note: For more options (e.g., --service-path), use ./scripts/test.sh directly"
        exit 1
        ;;
esac