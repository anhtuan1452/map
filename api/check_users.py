#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from django.contrib.auth.models import User

print("=" * 80)
print("ALL USERS IN DATABASE")
print("=" * 80)
print(f"{'ID':<5} {'Username':<20} {'Role':<15} {'Class':<20} {'School':<30}")
print("-" * 80)

users = User.objects.all().select_related('role_info')
for u in users:
    try:
        role = u.role_info.role
        class_name = u.role_info.class_name or ''
        school_name = u.role_info.school_name or ''
    except:
        role = 'NO ROLE'
        class_name = ''
        school_name = ''
    
    print(f"{u.id:<5} {u.username:<20} {role:<15} {class_name:<20} {school_name:<30}")

print("=" * 80)
print(f"Total users: {users.count()}")
