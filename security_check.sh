#!/bin/bash

# Security Check Script for Heritage Map Application
# Run this before deploying to production

echo "🔒 Security Check Starting..."
echo "================================"
echo ""

ERRORS=0
WARNINGS=0

# Check 1: SECRET_KEY
echo "📌 Checking SECRET_KEY..."
if grep -q "dev-secret-key-CHANGE-THIS" api/project/settings.py; then
    if [ "$DEBUG" = "False" ] || [ "$DJANGO_SECRET_KEY" = "dev-secret-key-CHANGE-THIS" ]; then
        echo "❌ ERROR: Default SECRET_KEY detected! MUST change before production!"
        ERRORS=$((ERRORS + 1))
    else
        echo "⚠️  WARNING: Default SECRET_KEY in code, but using env variable"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "✅ SECRET_KEY appears to be customized"
fi
echo ""

# Check 2: DEBUG mode
echo "📌 Checking DEBUG mode..."
if [ -f ".env" ]; then
    if grep -q "DEBUG=True" .env; then
        echo "⚠️  WARNING: DEBUG=True in .env file. Should be False in production!"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "✅ DEBUG appears to be False"
    fi
else
    echo "⚠️  WARNING: No .env file found. Using defaults!"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 3: ALLOWED_HOSTS
echo "📌 Checking ALLOWED_HOSTS..."
if [ -f ".env" ]; then
    if grep -q "ALLOWED_HOSTS=\*" .env; then
        echo "⚠️  WARNING: ALLOWED_HOSTS is set to wildcard (*). Specify domains in production!"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "✅ ALLOWED_HOSTS appears to be configured"
    fi
fi
echo ""

# Check 4: CSRF_TRUSTED_ORIGINS
echo "📌 Checking CSRF_TRUSTED_ORIGINS..."
if grep -q "localhost" api/project/settings.py; then
    echo "⚠️  WARNING: localhost found in CSRF_TRUSTED_ORIGINS. Add production domains!"
    WARNINGS=$((WARNINGS + 1))
fi
if grep -q "khoatkth-dhktdn.click" api/project/settings.py; then
    echo "✅ Production domain found in CSRF_TRUSTED_ORIGINS"
else
    echo "⚠️  WARNING: Production domain NOT found in CSRF_TRUSTED_ORIGINS!"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 5: Database password
echo "📌 Checking Database configuration..."
if [ -f ".env" ]; then
    if grep -q "POSTGRES_PASSWORD=change" .env; then
        echo "❌ ERROR: Default database password detected! Change before production!"
        ERRORS=$((ERRORS + 1))
    else
        echo "✅ Database password appears to be customized"
    fi
fi
echo ""

# Check 6: Authentication classes
echo "📌 Checking Authentication configuration..."
if grep -q "CsrfExemptSessionAuthentication" api/heritage/auth_views.py; then
    echo "✅ CsrfExemptSessionAuthentication is being used"
else
    echo "⚠️  WARNING: CsrfExemptSessionAuthentication not found in auth_views"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 7: AllowAny permissions
echo "📌 Checking for potentially unsafe AllowAny permissions..."
ALLOWANY_COUNT=$(grep -r "@permission_classes(\[AllowAny\])" api/heritage/ --include="*.py" | wc -l)
echo "   Found $ALLOWANY_COUNT endpoints with AllowAny permission"
if [ $ALLOWANY_COUNT -gt 10 ]; then
    echo "⚠️  WARNING: High number of public endpoints. Review each one!"
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ Reasonable number of public endpoints"
fi
echo ""

# Check 8: CORS configuration
echo "📌 Checking CORS configuration..."
if grep -q "CORS_ALLOW_ALL_ORIGINS = True" api/project/settings.py; then
    echo "⚠️  WARNING: CORS_ALLOW_ALL_ORIGINS found. Should be False in production!"
    echo "   (This is OK if it's under 'if DEBUG:' block)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 9: Session security
echo "📌 Checking Session cookie settings..."
if grep -q "SESSION_COOKIE_HTTPONLY = True" api/project/settings.py; then
    echo "✅ SESSION_COOKIE_HTTPONLY is True"
else
    echo "❌ ERROR: SESSION_COOKIE_HTTPONLY should be True!"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "SESSION_COOKIE_SECURE = not DEBUG" api/project/settings.py; then
    echo "✅ SESSION_COOKIE_SECURE is configured correctly"
else
    echo "⚠️  WARNING: SESSION_COOKIE_SECURE configuration may be incorrect"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 10: Password validators
echo "📌 Checking Password validators..."
if grep -q "AUTH_PASSWORD_VALIDATORS = \[\]" api/project/settings.py; then
    echo "⚠️  WARNING: No password validators configured. Consider adding them!"
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ Password validators appear to be configured"
fi
echo ""

# Summary
echo "================================"
echo "🏁 Security Check Complete"
echo "================================"
echo ""
echo "Summary:"
echo "  ❌ Critical Errors: $ERRORS"
echo "  ⚠️  Warnings: $WARNINGS"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo "❌ CANNOT DEPLOY: Fix all critical errors before deploying to production!"
    exit 1
elif [ $WARNINGS -gt 3 ]; then
    echo "⚠️  CAUTION: Multiple warnings detected. Review them before deploying."
    exit 0
else
    echo "✅ Security check passed! Review the checklist in SECURITY_CHECKLIST.md before deploying."
    exit 0
fi
