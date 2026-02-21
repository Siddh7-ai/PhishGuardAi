#!/usr/bin/env python3
"""
PhishGuard AI - Quick Setup Script
Helps initialize the application for development or production
"""

import os
import sys
import subprocess
import secrets
from pathlib import Path

def print_step(message):
    """Print a colored step message"""
    print(f"\n{'='*60}")
    print(f"  {message}")
    print(f"{'='*60}\n")

def print_success(message):
    """Print success message"""
    print(f"✅ {message}")

def print_error(message):
    """Print error message"""
    print(f"❌ {message}")

def print_warning(message):
    """Print warning message"""
    print(f"⚠️  {message}")

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"Running: {description}")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            print_error(f"Failed: {description}")
            print(result.stderr)
            return False
        print_success(description)
        return True
    except Exception as e:
        print_error(f"Error running command: {e}")
        return False

def setup_venv():
    """Create virtual environment"""
    print_step("Setting up Virtual Environment")
    
    venv_path = Path("venv")
    if venv_path.exists():
        print_warning("Virtual environment already exists")
        return True
    
    if sys.platform == "win32":
        return run_command("python -m venv venv", "Creating virtual environment")
    else:
        return run_command("python3 -m venv venv", "Creating virtual environment")

def install_dependencies():
    """Install Python dependencies"""
    print_step("Installing Dependencies")
    
    # Determine pip command based on OS
    if sys.platform == "win32":
        pip_cmd = "venv\\Scripts\\pip"
    else:
        pip_cmd = "venv/bin/pip"
    
    # Upgrade pip
    run_command(f"{pip_cmd} install --upgrade pip", "Upgrading pip")
    
    # Install requirements
    return run_command(
        f"{pip_cmd} install -r requirements.txt",
        "Installing requirements"
    )

def setup_env_file():
    """Create or update .env file"""
    print_step("Setting up Environment Variables")
    
    env_file = Path(".env")
    
    if env_file.exists():
        response = input(".env file already exists. Overwrite? (y/n): ").lower()
        if response != 'y':
            print_warning("Skipping .env setup")
            return True
    
    # Generate secure keys
    secret_key = secrets.token_urlsafe(32)
    jwt_secret_key = secrets.token_urlsafe(32)
    
    # Ask for environment
    env_type = input("Environment type (development/production) [development]: ").lower() or "development"
    
    if env_type == "production":
        print_warning("PRODUCTION MODE DETECTED")
        print("⚠️  Make sure to set proper CORS_ORIGINS and use HTTPS!")
        cors_origins = input("CORS Origins (comma-separated) [https://yourdomain.com]: ").strip()
        if not cors_origins:
            cors_origins = "https://yourdomain.com"
    else:
        cors_origins = "http://localhost:3000,http://localhost:8080,http://127.0.0.1:5500,http://localhost:5000"
    
    # Create .env file
    env_content = f"""# Flask Configuration
FLASK_ENV={env_type}
FLASK_APP=backend/app.py

# Security Keys (Generated - DO NOT SHARE)
SECRET_KEY={secret_key}
JWT_SECRET_KEY={jwt_secret_key}

# Database
DATABASE_PATH=backend/phishguard.db

# CORS Configuration
CORS_ORIGINS={cors_origins}

# Server Port
PORT=5000

# Rate Limiting
RATELIMIT_STORAGE_URL=memory://
"""
    
    with open(env_file, 'w') as f:
        f.write(env_content)
    
    print_success(f".env file created with secure keys")
    return True

def init_database():
    """Initialize database"""
    print_step("Initializing Database")
    
    if sys.platform == "win32":
        python_cmd = "venv\\Scripts\\python"
    else:
        python_cmd = "venv/bin/python"
    
    return run_command(
        f"{python_cmd} -c \"from backend.database import init_db; init_db()\"",
        "Initializing database"
    )

def check_model():
    """Check if model exists"""
    print_step("Checking ML Model")
    
    model_path = Path("model/phishing_model.pkl")
    
    if model_path.exists():
        print_success("ML model found at model/phishing_model.pkl")
        return True
    else:
        print_warning("ML model not found at model/phishing_model.pkl")
        print("You can:")
        print("  1. Train a new model: python ai/train_model.py (requires data/sample_urls.csv)")
        print("  2. Use pre-trained model (download from repository)")
        return False

def create_directories():
    """Create necessary directories"""
    print_step("Creating Directories")
    
    directories = [
        Path("logs"),
        Path("model"),
        Path("data")
    ]
    
    for directory in directories:
        directory.mkdir(exist_ok=True)
        print_success(f"Directory created/exists: {directory}")
    
    return True

def run_tests():
    """Run tests if pytest is available"""
    print_step("Running Tests (Optional)")
    
    if not Path("tests").exists():
        print_warning("No tests directory found")
        return True
    
    if sys.platform == "win32":
        python_cmd = "venv\\Scripts\\python"
    else:
        python_cmd = "venv/bin/python"
    
    return run_command(
        f"{python_cmd} -m pytest tests/ -v",
        "Running tests"
    )

def main():
    """Main setup flow"""
    print("\n")
    print("🛡️  PHISHGUARD AI - SETUP SCRIPT")
    print("═" * 60)
    
    # Determine setup mode
    mode = input("\nSetup mode (1: Development, 2: Production) [1]: ").strip() or "1"
    is_production = mode == "2"
    
    print_step(f"Setting up PhishGuard AI - {('PRODUCTION' if is_production else 'DEVELOPMENT')} MODE")
    
    # Print what we'll do
    print("This script will:")
    print("  1. Create virtual environment (if needed)")
    print("  2. Install dependencies")
    print("  3. Setup environment variables (.env)")
    print("  4. Create necessary directories")
    print("  5. Initialize database")
    print("  6. Check for ML model")
    
    confirm = input("\nContinue? (y/n): ").lower()
    if confirm != 'y':
        print("Setup cancelled")
        return 1
    
    steps = [
        ("Virtual Environment", setup_venv),
        ("Dependencies", install_dependencies),
        ("Directories", create_directories),
        ("Environment Variables", setup_env_file),
        ("Database", init_database),
        ("Model Check", check_model),
    ]
    
    failed_steps = []
    
    for step_name, step_func in steps:
        try:
            if not step_func():
                failed_steps.append(step_name)
        except Exception as e:
            print_error(f"Error in {step_name}: {e}")
            failed_steps.append(step_name)
    
    # Summary
    print_step("Setup Summary")
    
    if not failed_steps:
        print_success("All setup steps completed!")
        print("\n✅ Ready to launch PhishGuard AI!")
        
        if not is_production:
            print("\nTo start the backend:")
            if sys.platform == "win32":
                print("  cd backend")
                print("  ..\\venv\\Scripts\\python app.py")
            else:
                print("  cd backend")
                print("  ../venv/bin/python app.py")
            
            print("\nTo load the extension:")
            print("  1. Open Chrome → chrome://extensions/")
            print("  2. Enable 'Developer mode'")
            print("  3. Click 'Load unpacked'")
            print("  4. Select the 'extension' folder")
    else:
        print_warning(f"Setup completed with {len(failed_steps)} issue(s):")
        for step in failed_steps:
            print(f"  ⚠️  {step}")
        print("\nPlease review the errors above and try again.")
        return 1
    
    print("\n" + "="*60)
    print("Setup complete! Happy phishing detection! 🛡️")
    print("="*60 + "\n")
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)
