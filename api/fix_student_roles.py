#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from django.contrib.auth.models import User
from heritage.models import UserRole

print("=" * 80)
print("FIXING STUDENT ROLES")
print("=" * 80)

# Get all users with viewer role who have class_name or school_name
# (these are students who registered with full info)
users_to_fix = []
for user in User.objects.all().select_related('role_info'):
    try:
        role_info = user.role_info
        # If they have class or school name but role is viewer, they should be student
        if role_info.role == 'viewer' and (role_info.class_name or role_info.school_name):
            users_to_fix.append(user)
            print(f"Found: {user.username} - class: {role_info.class_name}, school: {role_info.school_name}")
    except:
        pass

print(f"\nFound {len(users_to_fix)} users to update to 'student' role")

if users_to_fix:
    confirm = input("Update these users to 'student' role? (yes/no): ")
    if confirm.lower() == 'yes':
        for user in users_to_fix:
            user.role_info.role = 'student'
            user.role_info.save()
            print(f"✅ Updated {user.username} to student")
        print(f"\n✅ Successfully updated {len(users_to_fix)} users!")
    else:
        print("Cancelled.")
else:
    print("No users need updating.")

print("=" * 80)
