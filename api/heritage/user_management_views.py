from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.core.paginator import Paginator
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import UserRole
from .authentication import CsrfExemptSessionAuthentication


def get_user_role(user):
    """Helper function to get user's role"""
    try:
        return user.role_info.role
    except UserRole.DoesNotExist:
        # Create default UserRole if doesn't exist
        role_info = UserRole.objects.create(user=user, role='student')
        return role_info.role


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user(request):
    """
    Tạo user mới (chỉ giáo viên và super_admin)
    """
    user_role = get_user_role(request.user)
    if user_role not in ['teacher', 'super_admin']:
        return Response({'error': 'Chỉ giáo viên và super_admin mới có quyền tạo user'}, status=status.HTTP_403_FORBIDDEN)
    
    username = request.data.get('username')
    password = request.data.get('password')
    role = request.data.get('role', 'tourist')
    email = request.data.get('email', '')
    phone = request.data.get('phone', '')
    organization = request.data.get('organization', '')
    class_name = request.data.get('class_name', '')
    school_name = request.data.get('school_name', '')
    notes = request.data.get('notes', '')
    
    if not username or not password:
        return Response({'error': 'username and password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate role
    valid_roles = ['viewer', 'student', 'tourist', 'teacher', 'admin']
    if user_role != 'super_admin':
        valid_roles.remove('admin')  # Only super_admin can create admin
    
    if role not in valid_roles:
        return Response({'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if username exists
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create user
    user = User.objects.create_user(
        username=username,
        password=password,
        email=email
    )
    
    # Create UserRole
    UserRole.objects.create(
        user=user,
        role=role,
        phone=phone,
        organization=organization,
        class_name=class_name,
        school_name=school_name,
        notes=notes
    )
    
    return Response({
        'message': 'User created successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'role': role,
            'email': user.email,
            'phone': phone,
            'organization': organization,
            'class_name': class_name,
            'school_name': school_name,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_role(request, user_id):
    # Check authentication
    if not request.user.is_authenticated:
        return Response({'error': 'Cần đăng nhập để thực hiện thao tác này'}, status=status.HTTP_401_UNAUTHORIZED)
    
    user_role = get_user_role(request.user)
    
    if user_role not in ['teacher', 'super_admin']:
        return Response({'error': 'Chỉ giáo viên và super_admin mới có quyền thay đổi role'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
        role_info = user.role_info
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except UserRole.DoesNotExist:
        # Create UserRole if doesn't exist
        role_info = UserRole.objects.create(user=user, role='student')
    
    new_role = request.data.get('role')
    if not new_role:
        return Response({'error': 'role is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate role - chỉ super_admin mới có thể đổi role
    valid_roles = ['student', 'tourist', 'teacher', 'super_admin']
    
    # Chỉ super_admin mới có thể gán role super_admin
    if new_role == 'super_admin' and user_role != 'super_admin':
        return Response({'error': 'Chỉ super_admin mới có thể gán quyền super_admin'}, status=status.HTTP_403_FORBIDDEN)
    
    if new_role not in valid_roles:
        return Response({'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Update role and optional fields
    role_info.role = new_role
    if 'phone' in request.data:
        role_info.phone = request.data.get('phone', '')
    if 'organization' in request.data:
        role_info.organization = request.data.get('organization', '')
    if 'class_name' in request.data:
        role_info.class_name = request.data.get('class_name', '')
    if 'school_name' in request.data:
        role_info.school_name = request.data.get('school_name', '')
    if 'notes' in request.data:
        role_info.notes = request.data.get('notes', '')
    
    role_info.save()
    
    return Response({
        'message': 'Role assigned successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'role': new_role,
            'phone': role_info.phone,
            'organization': role_info.organization,
            'class_name': role_info.class_name,
            'school_name': role_info.school_name,
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])  # Cho phép public để frontend có thể test
def list_users(request):
    """
    Lấy danh sách users với search
    """
    # Nếu user đã đăng nhập, check role
    if request.user.is_authenticated:
        user_role = get_user_role(request.user)
        if user_role not in ['teacher', 'super_admin']:
            return Response({'error': 'Chỉ giáo viên và super admin mới có quyền xem danh sách người dùng'}, 
                           status=status.HTTP_403_FORBIDDEN)
    
    users = User.objects.all().order_by('-date_joined').select_related('role_info')
    
    # Search
    search = request.GET.get('search', '')
    if search:
        users = users.filter(
            Q(username__icontains=search) | Q(email__icontains=search)
        )
    
    # Filter by role
    role_filter = request.GET.get('role')
    if role_filter:
        users = users.filter(role_info__role=role_filter)
    
    # Pagination
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 20)
    paginator = Paginator(users, page_size)
    
    try:
        users_page = paginator.page(page)
    except:
        users_page = paginator.page(1)
    
    results = []
    for user in users_page:
        user_role_info = get_user_role(user)
        try:
            role_obj = user.role_info
            phone = role_obj.phone
            organization = role_obj.organization
            class_name = role_obj.class_name
            school_name = role_obj.school_name
        except:
            phone = ''
            organization = ''
            class_name = ''
            school_name = ''
            
        results.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user_role_info,
            'phone': phone,
            'organization': organization,
            'class_name': class_name,
            'school_name': school_name,
            'date_joined': user.date_joined,
            'last_login': user.last_login,
        })
    
    return Response({
        'results': results,
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': users_page.number,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Đổi password (user tự đổi password của mình)
    """
    user = request.user
    
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response({'error': 'old_password and new_password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check old password
    if not user.check_password(old_password):
        return Response({'error': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate new password
    if len(new_password) < 6:
        return Response({'error': 'New password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Set new password
    user.set_password(new_password)
    user.save()
    
    return Response({'message': 'Password changed successfully'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_school_class(request):
    user = request.user

    try:
        class_name = request.data.get('class_name', '').strip()
        school_name = request.data.get('school_name', '').strip()

        try:
            role_info = user.role_info
            role_info.class_name = class_name
            role_info.school_name = school_name
            role_info.save()
        except User.role_info.RelatedObjectDoesNotExist:
            UserRole.objects.create(
                user=user,
                role='student',
                class_name=class_name,
                school_name=school_name
            )

        return Response({
            'message': 'Cập nhật thông tin thành công',
            'class_name': class_name,
            'school_name': school_name
        })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_email(request):
    try:
        user = request.user

        new_email = request.data.get('email')
        if not new_email:
            return Response({'error': 'Email là bắt buộc'}, status=status.HTTP_400_BAD_REQUEST)

        new_email = new_email.strip().lower()

        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(new_email)
        except ValidationError:
            return Response({'error': 'Email không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=new_email).exclude(id=user.id).exists():
            return Response({'error': 'Email này đã được sử dụng'}, status=status.HTTP_400_BAD_REQUEST)

        user.email = new_email
        user.save()

        return Response({
            'message': 'Cập nhật email thành công',
            'email': new_email
        })

    except Exception as e:
        return Response({'error': f'Lỗi hệ thống: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

