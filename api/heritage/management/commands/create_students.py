from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Tạo 50 tài khoản học sinh'

    def handle(self, *args, **options):
        created_count = 0
        
        for i in range(1, 51):
            username = f'hocsinh{i:02d}'  # hocsinh01, hocsinh02, ...
            
            # Kiểm tra xem user đã tồn tại chưa
            if User.objects.filter(username=username).exists():
                self.stdout.write(f'⚠️  {username} đã tồn tại')
                continue
            
            # Tạo user mới
            user = User.objects.create_user(
                username=username,
                password='123456',
                email=f'{username}@student.edu.vn',
                is_staff=False,
                is_superuser=False
            )
            
            created_count += 1
            self.stdout.write(f'✅ Tạo {username}')
        
        self.stdout.write(self.style.SUCCESS(f'\n🎉 Đã tạo {created_count} tài khoản học sinh mới!'))
        self.stdout.write(self.style.SUCCESS(f'Username: hocsinh01 đến hocsinh50'))
        self.stdout.write(self.style.SUCCESS(f'Password: 123456'))
