#!/bin/sh

# =============================================================================
# Mochimono Docker Entrypoint Script
# =============================================================================
# This script initializes the database and starts the application when the container starts

set -euo pipefail

# Configuration
readonly APP_NAME="Mochimono"
readonly APP_VERSION="1.0.0"
readonly DATA_DIR="/app/data"
readonly DB_FILE="${DATA_DIR}/mochimono.db"
readonly LOG_LEVEL="${LOG_LEVEL:-INFO}"

# Color output (only when tty is available)
if [ -t 1 ]; then
    readonly RED='\033[0;31m'
    readonly GREEN='\033[0;32m'
    readonly YELLOW='\033[1;33m'
    readonly BLUE='\033[0;34m'
    readonly PURPLE='\033[0;35m'
    readonly CYAN='\033[0;36m'
    readonly NC='\033[0m' # No Color
else
    readonly RED=''
    readonly GREEN=''
    readonly YELLOW=''
    readonly BLUE=''
    readonly PURPLE=''
    readonly CYAN=''
    readonly NC=''
fi

# Log functions
log() {
    local level="$1"
    local message="$2"
    local timestamp="$(date +'%Y-%m-%d %H:%M:%S')"
    
    case "$level" in
        "INFO")  printf "${CYAN}[%s] INFO${NC}  %s\n" "$timestamp" "$message" ;;
        "WARN")  printf "${YELLOW}[%s] WARN${NC}  %s\n" "$timestamp" "$message" ;;
        "ERROR") printf "${RED}[%s] ERROR${NC} %s\n" "$timestamp" "$message" ;;
        "DEBUG") 
            if [ "$LOG_LEVEL" = "DEBUG" ]; then
                printf "${PURPLE}[%s] DEBUG${NC} %s\n" "$timestamp" "$message"
            fi
            ;;
        *)       printf "[%s] %s\n" "$timestamp" "$message" ;;
    esac
}

info() { log "INFO" "$1"; }
warn() { log "WARN" "$1"; }
error() { log "ERROR" "$1"; }
debug() { log "DEBUG" "$1"; }

# Environment variable validation
validate_env() {
    local missing_vars=""
    local optional_vars=""
    
    # Required environment variables
    [ -z "${NEXTAUTH_URL:-}" ] && missing_vars="$missing_vars NEXTAUTH_URL"
    [ -z "${NEXTAUTH_SECRET:-}" ] && missing_vars="$missing_vars NEXTAUTH_SECRET"
    [ -z "${GOOGLE_CLIENT_ID:-}" ] && missing_vars="$missing_vars GOOGLE_CLIENT_ID"
    [ -z "${GOOGLE_CLIENT_SECRET:-}" ] && missing_vars="$missing_vars GOOGLE_CLIENT_SECRET"
    
    # Check optional environment variables
    [ -z "${DATABASE_URL:-}" ] && optional_vars="$optional_vars DATABASE_URL"
    
    if [ -n "$missing_vars" ]; then
        error "Required environment variables are not set:$missing_vars"
        echo
        echo "${YELLOW}Usage example:${NC}"
        echo "  docker run -d \\"
        echo "    --name mochimono \\"
        echo "    -p 3000:3000 \\"
        echo "    -v ./data:/app/data \\"
        echo "    -e NEXTAUTH_URL=http://localhost:3000 \\"
        echo "    -e NEXTAUTH_SECRET=your-secret-key \\"
        echo "    -e GOOGLE_CLIENT_ID=your-client-id \\"
        echo "    -e GOOGLE_CLIENT_SECRET=your-client-secret \\"
        echo "    mochimono"
        echo
        return 1
    fi
    
    info "Environment variable validation completed"
    
    if [ -n "$optional_vars" ]; then
        debug "Optional environment variables (using default values):$optional_vars"
    fi
    
    # Display configuration (mask sensitive information)
    debug "NEXTAUTH_URL: ${NEXTAUTH_URL}"
    debug "NEXTAUTH_SECRET: [Masked ${#NEXTAUTH_SECRET} characters]"
    debug "GOOGLE_CLIENT_ID: $(echo "${GOOGLE_CLIENT_ID}" | sed 's/\(.\{6\}\).*/\1.../')"
    debug "GOOGLE_CLIENT_SECRET: [Masked ${#GOOGLE_CLIENT_SECRET} characters]"
    debug "DATABASE_URL: ${DATABASE_URL:-file:/app/data/mochimono.db}"
}

# Data directory preparation
prepare_data_dir() {
    info "Preparing data directory..."
    
    if [ ! -d "$DATA_DIR" ]; then
        debug "Creating data directory: $DATA_DIR"
        mkdir -p "$DATA_DIR"
    fi
    
    # Permission check
    if [ ! -w "$DATA_DIR" ]; then
        error "No write permission for data directory: $DATA_DIR"
        return 1
    fi
    
    debug "Data directory preparation completed: $DATA_DIR"
}

# Database initialization
init_database() {
    info "Initializing database..."
    
    # Check if database file exists and has proper schema
    if [ -f "$DB_FILE" ]; then
        local db_size=$(stat -f%z "$DB_FILE" 2>/dev/null || stat -c%s "$DB_FILE" 2>/dev/null || echo "0")
        info "Found existing database: $(basename "$DB_FILE") (${db_size} bytes)"
        
        if [ "$db_size" = "0" ]; then
            info "Database file is empty. Initializing schema..."
            if ! npx prisma db push --accept-data-loss; then
                error "Failed to initialize database schema"
                return 1
            fi
            info "Database schema initialized successfully"
        else
            info "Database appears to contain data. Checking schema..."
            # Always run db push to ensure schema is up to date
            if ! npx prisma db push --accept-data-loss; then
                warn "Schema update failed, but continuing..."
            else
                debug "Database schema is up to date"
            fi
        fi
    else
        info "Database not found. Creating and initializing..."
        
        # Initialize database with schema
        if ! npx prisma db push --accept-data-loss; then
            error "Failed to create and initialize database"
            return 1
        fi
        
        info "Database created and initialized successfully"
    fi
    
    debug "Database initialization completed"
}

# Application readiness check
check_app_readiness() {
    info "Checking application readiness..."
    
    # Check for required files
    local required_files="server.js package.json"
    for file in $required_files; do
        if [ ! -f "/app/$file" ]; then
            error "Required file not found: $file"
            return 1
        fi
    done
    
    # Check Prisma client generation
    if [ ! -d "/app/node_modules/.prisma" ]; then
        error "Prisma client not found. This indicates a build issue."
        error "Prisma client should be generated during Docker build, not at runtime."
        return 1
    else
        debug "Prisma client found"
    fi
    
    debug "Application is ready"
}

# Signal handling
cleanup() {
    echo
    info "Received termination signal (Ctrl-C). Shutting down gracefully..."
    
    # If application is running, try to terminate it gracefully
    if [ ! -z "${APP_PID:-}" ]; then
        info "Stopping application (PID: $APP_PID)..."
        kill -TERM "$APP_PID" 2>/dev/null || true
        
        # Wait up to 10 seconds for graceful shutdown
        local count=0
        while kill -0 "$APP_PID" 2>/dev/null && [ $count -lt 10 ]; do
            sleep 1
            count=$((count + 1))
        done
        
        # Force kill if still running
        if kill -0 "$APP_PID" 2>/dev/null; then
            warn "Application did not shut down gracefully. Force stopping..."
            kill -KILL "$APP_PID" 2>/dev/null || true
        fi
    fi
    
    info "Cleanup completed. Goodbye!"
    exit 0
}

# Set up signal traps
trap cleanup SIGTERM SIGINT SIGQUIT

# Main execution function
main() {
    printf "${GREEN}===========================================${NC}\n"
    printf "${GREEN} %s v%s${NC}\n" "$APP_NAME" "$APP_VERSION"
    printf "${GREEN} Personal Items Memo Application${NC}\n"
    printf "${GREEN}===========================================${NC}\n"
    
    info "Starting container..."
    
    # Runtime environment information
    debug "Node.js version: $(node --version)"
    debug "NPM version: $(npm --version)"
    debug "Working directory: $(pwd)"
    debug "User: $(whoami)"
    
    # Execute each stage
    validate_env || exit 1
    prepare_data_dir || exit 1
    init_database || exit 1
    check_app_readiness || exit 1
    
    info "Initialization completed"
    printf "${GREEN}===========================================${NC}\n"
    info "Starting application..."
    info "Port: ${PORT:-3000}"
    info "Environment: ${NODE_ENV:-production}"
    info "Database: ${DATABASE_URL:-file:/app/data/mochimono.db}"
    printf "${GREEN}===========================================${NC}\n"
    
    # Execute application
    # Start application in background to capture PID for graceful shutdown
    "$@" &
    APP_PID=$!
    
    # Wait for application to finish
    wait $APP_PID
}

# Call main only if script is executed directly
# Note: Using a more portable approach instead of BASH_SOURCE
main "$@"