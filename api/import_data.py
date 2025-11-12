#!/usr/bin/env python
"""
Script để import dữ liệu người dùng và site từ file JSON vào database
"""
import os
import sys
import django
import json
from datetime import datetime

# Thêm đường dẫn Django project
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')

# Khởi tạo Django
django.setup()

from django.contrib.auth.models import User
from heritage.models import Site, UserRole, UserProfile
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

def import_data(json_file_path):
    """Import dữ liệu từ file JSON"""

    print(f"Bắt đầu import dữ liệu từ {json_file_path}...")

    # Đọc file JSON
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print("Metadata:")
    print(f"  Exported at: {data['metadata']['exported_at']}")
    print(f"  Users: {data['metadata']['total_users']}")
    print(f"  Sites: {data['metadata']['total_sites']}")
    print(f"  User roles: {data['metadata']['total_user_roles']}")
    print(f"  User profiles: {data['metadata']['total_user_profiles']}")

    # Import users
    print("\nImporting users...")
    user_count = 0
    for user_data in data['users']:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': user_data.get('email', ''),
                'first_name': user_data.get('first_name', ''),
                'last_name': user_data.get('last_name', ''),
                'is_active': user_data.get('is_active', True),
                'is_staff': user_data.get('is_staff', False),
                'is_superuser': user_data.get('is_superuser', False),
                'date_joined': user_data.get('date_joined'),
                'last_login': user_data.get('last_login'),
            }
        )
        if created:
            user_count += 1
            # Set password hash if available (but we don't export passwords for security)
            if 'password' in user_data:
                user.password = user_data['password']
                user.save()

    print(f"Imported {user_count} new users")

    # Import sites
    print("\nImporting sites...")
    site_count = 0
    for site_data in data['sites']:
        site, created = Site.objects.get_or_create(
            site_id=site_data['site_id'],
            defaults={
                'name': site_data['name'],
                'geojson': site_data['geojson'],
                'image_urls': site_data.get('image_urls', []),
                'conservation_status': site_data.get('conservation_status', 'good'),
                'status_description': site_data.get('status_description', ''),
                'conduct': site_data.get('conduct', {}),
                'created': site_data.get('created'),
                'updated': site_data.get('updated'),
            }
        )
        if created:
            site_count += 1

    print(f"Imported {site_count} new sites")

    # Import user roles
    print("\nImporting user roles...")
    role_count = 0
    for role_data in data['user_roles']:
        try:
            user = User.objects.get(username=role_data['username'])
            role, created = UserRole.objects.get_or_create(
                user=user,
                defaults={
                    'role': role_data['role'],
                    'phone': role_data.get('phone', ''),
                    'organization': role_data.get('organization', ''),
                    'class_name': role_data.get('class_name', ''),
                    'school_name': role_data.get('school_name', ''),
                    'notes': role_data.get('notes', ''),
                    'created_at': role_data.get('created_at'),
                    'updated_at': role_data.get('updated_at'),
                }
            )
            if created:
                role_count += 1
        except User.DoesNotExist:
            print(f"Warning: User {role_data['username']} not found, skipping role")

    print(f"Imported {role_count} new user roles")

    # Import user profiles
    print("\nImporting user profiles...")
    profile_count = 0
    for profile_data in data['user_profiles']:
        profile, created = UserProfile.objects.get_or_create(
            user_name=profile_data['user_name'],
            defaults={
                'avatar': profile_data.get('avatar'),
                'total_xp': profile_data.get('total_xp', 0),
                'level': profile_data.get('level', 1),
                'display_name': profile_data.get('display_name', ''),
                'bio': profile_data.get('bio', ''),
                'joined_at': profile_data.get('joined_at'),
                'last_active': profile_data.get('last_active'),
            }
        )
        if created:
            profile_count += 1

    print(f"Imported {profile_count} new user profiles")

    print("\nImport hoàn thành!")
    print(f"Tổng users trong DB: {User.objects.count()}")
    print(f"Tổng sites trong DB: {Site.objects.count()}")
    print(f"Tổng user roles trong DB: {UserRole.objects.count()}")
    print(f"Tổng user profiles trong DB: {UserProfile.objects.count()}")

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python import_data.py <json_file_path>")
        sys.exit(1)

    json_file = sys.argv[1]
    if not os.path.exists(json_file):
        print(f"File {json_file} not found")
        sys.exit(1)

    import_data(json_file)