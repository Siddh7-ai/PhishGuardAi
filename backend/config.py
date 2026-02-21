""""
Configuration management for PhishGuard AI
"""
import os
from datetime import timedelta

# Load environment variables from .env file in development
if os.getenv('FLASK_ENV') != 'production':
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

class Config:
    """Base configuration"""
    
    # Security secrets
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret-change-in-production')
    
    # JWT settings
    JWT_EXPIRATION_DELTA = timedelta(hours=int(os.environ.get('JWT_EXPIRATION_HOURS', '1')))
    JWT_ALGORITHM = 'HS256'
    
    # Database path (relative to backend folder)
    DATABASE_PATH = os.environ.get('DATABASE_PATH', 'phishguard.db')
    
    # CORS - parse from environment variable
    _cors_origins_str = os.environ.get('CORS_ORIGINS', 'http://localhost:8080,http://127.0.0.1:8080,http://localhost:5500')
    CORS_ORIGINS = [origin.strip() for origin in _cors_origins_str.split(',')]
    
    # Rate limiting
    RATELIMIT_STORAGE_URL = os.environ.get('RATELIMIT_STORAGE_URL', 'memory://')
    RATELIMIT_DEFAULT = os.environ.get('RATELIMIT_DEFAULT', "100 per hour")
    RATELIMIT_AUTH = os.environ.get('RATELIMIT_AUTH', "5 per minute")
    
    # Password policy
    MIN_PASSWORD_LENGTH = int(os.environ.get('MIN_PASSWORD_LENGTH', '8'))
    REQUIRE_SPECIAL_CHAR = os.environ.get('REQUIRE_SPECIAL_CHAR', 'True').lower() == 'true'
    REQUIRE_UPPERCASE = os.environ.get('REQUIRE_UPPERCASE', 'True').lower() == 'true'
    REQUIRE_NUMBER = os.environ.get('REQUIRE_NUMBER', 'True').lower() == 'true'