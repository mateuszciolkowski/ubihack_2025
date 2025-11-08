"""
Django settings for api project.
"""

from pathlib import Path
from dotenv import load_dotenv
import os
from datetime import timedelta
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# --- KONFIGURACJA ZMIENNYCH ŚRODOWISKOWYCH DLA COOLIFY ---
# Coolify musi ustawić te zmienne w usłudze backendowej (API)!
HOST_URL = os.getenv('HOST_URL', '127.0.0.1') 
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5175') 
DJANGO_DEBUG = os.getenv('DJANGO_DEBUG', 'True') == 'True' # Dynamiczne ustawienie DEBUG

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('BACKEND_SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = DJANGO_DEBUG

# 🎯 POPRAWKA: Dynamiczny ALLOWED_HOSTS
# Dodajemy HOST_URL z Coolify, aby uniknąć błędu DisallowedHost.
ALLOWED_HOSTS = [
    HOST_URL,
    '127.0.0.1',
    'localhost',
    # Dodanie domeny frontendu, jeśli jest w innej subdomenie (opcjonalne, ale bezpieczne)
    FRONTEND_URL.replace("https://", "").replace("http://", ""), 
    # Używamy '*' w trybie DEBUG
    *([ '*' ] if DEBUG else [])
]

# --- KONFIGURACJA CORS ---
# 🎯 POPRAWKA: JAWNIE OKREŚL DOZWOLONE ŹRÓDŁA Z FRONTENDU
CORS_ALLOWED_ORIGINS = [
    FRONTEND_URL, 
    "http://localhost:5175", # Dla lokalnego developmentu
    "http://127.0.0.1:5175", # Dla lokalnego developmentu
]

# Aby obsłużyć przypadek, gdy zmienna Coolify jest pusta
if FRONTEND_URL and FRONTEND_URL not in CORS_ALLOWED_ORIGINS:
     CORS_ALLOWED_ORIGINS.append(FRONTEND_URL)

CORS_ALLOW_METHODS = [
    "DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT",
]

CORS_ALLOW_HEADERS = [
    "accept", "authorization", "content-type", "user-agent",
    "x-csrftoken", "x-requested-with",
]

CSRF_TRUSTED_ORIGINS = [
    os.getenv('FRONTEND_URL', 'http://localhost:5175'), 
    "http://localhost:5173", # 🎯 DODAJ TĘ LINIĘ
    "http://127.0.0.1:5173", # I TĘ DLA PEWNOŚCI
]

CORS_ALLOW_CREDENTIALS = True

# 🎯 POPRAWKA: Konfiguracja dla proxy Coolify (HTTPS)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Application definition
INSTALLED_APPS = [
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'security',
    'stress_classification',
    'patient_management',
    'drf_spectacular',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Hackathon API',
    'DESCRIPTION': 'Hackathon API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}


ROOT_URLCONF = 'api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'api.wsgi.application'


# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB'),
        'USER': os.getenv('POSTGRES_USER'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD'),
        'HOST': 'db_hackathon',  
        'PORT': '5432',     
    }
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'security.User'

# Simple JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    
    'JTI_CLAIM': 'jti',
}