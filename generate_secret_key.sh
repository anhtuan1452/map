#!/bin/bash
# Generate a secure Django SECRET_KEY

python3 -c "
import secrets
import string

# Generate a 50-character random string
chars = string.ascii_letters + string.digits + '!@#$%^&*(-_=+)'
secret_key = ''.join(secrets.choice(chars) for i in range(50))

print('Generated Django SECRET_KEY:')
print(secret_key)
print()
print('Add this to your .env file:')
print('DJANGO_SECRET_KEY=$secret_key')
"