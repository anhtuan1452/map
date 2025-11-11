from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.middleware.csrf import get_token
from .models import UserRole


def get_user_role(user):
    """Helper function to get user's role"""
    try:
        return user.role_info.role
    except UserRole.DoesNotExist:
        # Create default UserRole if doesn't exist
        role_info = UserRole.objects.create(user=user, role='student')
        return role_info.role


@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Endpoint để lấy CSRF token.
    Frontend gọi endpoint này trước khi thực hiện các request cần CSRF protection.
    """
    return Response({'detail': 'CSRF cookie set'})


@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Username và password là bắt buộc'},
                       status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)

    if user:
        refresh = RefreshToken.for_user(user)

        user_role = get_user_role(user)

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'role': user_role
            }
        })
    else:
        return Response({'error': 'Sai tên đăng nhập hoặc mật khẩu'},
                       status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_api(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')
    class_name = request.data.get('class_name', '')
    school_name = request.data.get('school_name', '')
    role = request.data.get('role', 'viewer')  # Get role from request, default to 'viewer'
    
    if not username or not password:
        return Response({'error': 'Username và password là bắt buộc'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Validate password length
    if len(password) < 6:
        return Response({'error': 'Mật khẩu phải có ít nhất 6 ký tự'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Validate username length and format
    if len(username) < 3:
        return Response({'error': 'Tên đăng nhập phải có ít nhất 3 ký tự'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    if len(username) > 150:
        return Response({'error': 'Tên đăng nhập không được vượt quá 150 ký tự'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Validate username contains only alphanumeric, underscore, hyphen
    import re
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return Response({'error': 'Tên đăng nhập chỉ được chứa chữ cái, số, gạch dưới (_) và gạch ngang (-)'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Validate role - only allow student and tourist for public registration
    allowed_roles = ['student', 'tourist']
    if role not in allowed_roles:
        role = 'student'  # Force default to student if invalid role
    
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Tên đăng nhập đã tồn tại'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.create_user(
        username=username,
        password=password,
        email=email
    )
    
    # Create UserRole with class and school info, and specified role
    UserRole.objects.create(
        user=user,
        role=role,
        class_name=class_name,
        school_name=school_name
    )
    
    return Response({
        'message': 'Tạo tài khoản thành công',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': role,
            'class_name': class_name,
            'school_name': school_name
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_api(request):
    """Django logout endpoint"""
    logout(request)
    return Response({'message': 'Đăng xuất thành công'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user_role = get_user_role(request.user)
    
    # Get additional info from UserRole
    try:
        role_info = request.user.role_info
        class_name = role_info.class_name
        school_name = role_info.school_name
        phone = role_info.phone
        organization = role_info.organization
    except UserRole.DoesNotExist:
        class_name = ''
        school_name = ''
        phone = ''
        organization = ''
    
    return Response({
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'is_staff': request.user.is_staff,
            'is_superuser': request.user.is_superuser,
            'role': user_role,
            'class_name': class_name,
            'school_name': school_name,
            'phone': phone,
            'organization': organization
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users(request):
    # Chỉ teacher và super_admin mới có thể xem danh sách users
    user_role = get_user_role(request.user)
    if user_role not in ['teacher', 'super_admin']:
        return Response({'error': 'Chỉ giáo viên và super admin mới có quyền xem danh sách người dùng'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    users = User.objects.all().select_related('role_info')
    
    users_list = []
    for user in users:
        user_role = get_user_role(user)
        users_list.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'date_joined': user.date_joined,
            'last_login': user.last_login,
            'role': user_role
        })
    
    return Response({'users': users_list})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_user_role(request, user_id):
    # Chỉ super_admin mới có thể thay đổi vai trò
    user_role = get_user_role(request.user)
    if user_role != 'super_admin':
        return Response({'error': 'Không có quyền thực hiện thao tác này'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
        role = request.data.get('role')
        
        # Update UserRole
        try:
            role_info = user.role_info
            role_info.role = role
            role_info.save()
        except UserRole.DoesNotExist:
            UserRole.objects.create(user=user, role=role)
        
        # Also update Django staff/superuser flags for backward compatibility
        if role == 'super_admin':
            user.is_superuser = True
            user.is_staff = True
        elif role == 'teacher':
            user.is_superuser = False
            user.is_staff = True
        else:
            user.is_superuser = False
            user.is_staff = False
        
        user.save()
        
        return Response({'message': 'Cập nhật vai trò thành công'})
        
    except User.DoesNotExist:
        return Response({'error': 'Không tìm thấy user'}, status=status.HTTP_404_NOT_FOUND)





@api_view(['GET'])
@permission_classes([AllowAny])
def get_role_choices(request):
    """Trả về danh sách roles hợp lệ"""
    return Response({
        'roles': [
            {'value': 'student', 'label': 'Học sinh'},
            {'value': 'tourist', 'label': 'Khách du lịch'},
            {'value': 'teacher', 'label': 'Giáo viên'},
            {'value': 'super_admin', 'label': 'Super Admin'},
        ]
    })