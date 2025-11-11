"""
Script để update user roles:
- viewer -> student
- admin -> teacher (hoặc super_admin nếu là superuser)
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from django.contrib.auth.models import User
from heritage.models import UserRole

def update_roles():
    print("Bắt đầu cập nhật roles...")
    
    # Lấy tất cả UserRole
    all_roles = UserRole.objects.all()
    
    updated_count = 0
    for role_info in all_roles:
        old_role = role_info.role
        new_role = old_role
        
        # Chuyển viewer -> student
        if old_role == 'viewer':
            new_role = 'student'
            
        # Chuyển admin -> teacher hoặc super_admin
        elif old_role == 'admin':
            # Nếu user có is_superuser=True thì chuyển thành super_admin
            if role_info.user.is_superuser:
                new_role = 'super_admin'
            else:
                new_role = 'teacher'
        
        # Update nếu có thay đổi
        if new_role != old_role:
            role_info.role = new_role
            role_info.save()
            print(f"✓ Updated {role_info.user.username}: {old_role} -> {new_role}")
            updated_count += 1
    
    print(f"\n✅ Hoàn tất! Đã cập nhật {updated_count} users.")
    
    # Hiển thị thống kê
    print("\nThống kê roles hiện tại:")
    for role_choice in UserRole.ROLE_CHOICES:
        role_code = role_choice[0]
        role_name = role_choice[1]
        count = UserRole.objects.filter(role=role_code).count()
        print(f"  - {role_name} ({role_code}): {count} users")

if __name__ == '__main__':
    update_roles()
