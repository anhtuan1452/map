from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.core.paginator import Paginator
from django.db.models import Q
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from datetime import datetime
import os
from .models import Comment, Site
from .comment_serializers import CommentSerializer, CommentCreateSerializer
from .auth_views import get_user_role


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def comment_list_create(request):
    """
    GET: Lấy danh sách comment của một site (có phân trang và filter)
    POST: Tạo comment mới (tourist/student)
    """
    if request.method == 'GET':
        site_id = request.GET.get('site_id')
        if not site_id:
            return Response({'error': 'site_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            site = Site.objects.get(site_id=site_id)
        except Site.DoesNotExist:
            return Response({'error': 'Site not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get comments for this site
        comments = Comment.objects.filter(site=site)
        
        # Filter by date range
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d')
                comments = comments.filter(created_at__gte=start)
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d')
                comments = comments.filter(created_at__lte=end)
            except ValueError:
                pass
        
        # Pagination
        page = request.GET.get('page', 1)
        page_size = request.GET.get('page_size', 10)
        paginator = Paginator(comments, page_size)
        
        try:
            comments_page = paginator.page(page)
        except:
            comments_page = paginator.page(1)
        
        serializer = CommentSerializer(comments_page, many=True, context={'request': request})
        
        return Response({
            'results': serializer.data,
            'count': paginator.count,
            'total_pages': paginator.num_pages,
            'current_page': comments_page.number,
            'has_next': comments_page.has_next(),
            'has_previous': comments_page.has_previous(),
        })
    
    elif request.method == 'POST':
        from django.utils import timezone
        from datetime import timedelta
        
        # Rate limiting: 2 phút/bình luận
        user_name = request.data.get('user_name')
        if user_name:
            last_comment = Comment.objects.filter(user_name=user_name).order_by('-created_at').first()
            if last_comment:
                time_diff = timezone.now() - last_comment.created_at
                if time_diff < timedelta(minutes=2):
                    seconds_left = int((timedelta(minutes=2) - time_diff).total_seconds())
                    return Response({
                        'error': f'Vui lòng chờ {seconds_left} giây trước khi bình luận tiếp'
                    }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Validate images (max 3, max 10MB each)
        import json
        images_json = request.data.get('images', '[]')
        try:
            images = json.loads(images_json) if isinstance(images_json, str) else images_json
        except:
            images = []
        
        if len(images) > 3:
            return Response({'error': 'Tối đa 3 ảnh mỗi bình luận'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = CommentCreateSerializer(data=request.data)
        if serializer.is_valid():
            comment = serializer.save()
            
            # Link user if authenticated
            if request.user.is_authenticated:
                comment.user = request.user
                comment.save()
            
            return Response(
                CommentSerializer(comment, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def comment_delete(request, comment_id):
    """
    Xóa comment (chỉ chủ comment hoặc teacher/admin)
    """
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)
    
    user = request.user
    user_role = get_user_role(user)
    
    # Check permission
    can_delete = False
    if user_role in ['teacher', 'super_admin']:
        can_delete = True
    elif hasattr(user, 'username') and user.username == comment.user_name:
        can_delete = True
    
    if not can_delete:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    comment.delete()
    return Response({'message': 'Comment deleted successfully'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def comment_report(request, comment_id):
    """
    Báo cáo comment (tourist/student)
    """
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)
    
    user_name = request.data.get('user_name')
    if not user_name:
        return Response({'error': 'user_name is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user already reported
    if user_name in comment.reported_by:
        return Response({'error': 'You already reported this comment'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Add report
    comment.reported_by.append(user_name)
    comment.report_count += 1
    comment.is_reported = True
    comment.save()
    
    return Response({
        'message': 'Comment reported successfully',
        'report_count': comment.report_count
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reported_comments_list(request):
    """
    Lấy danh sách comment bị báo cáo (teacher/admin)
    """
    user = request.user
    user_role = get_user_role(user)
    if user_role not in ['teacher', 'super_admin']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    reported_comments = Comment.objects.filter(is_reported=True).order_by('-report_count', '-created_at')
    
    # Pagination
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 20)
    paginator = Paginator(reported_comments, page_size)
    
    try:
        comments_page = paginator.page(page)
    except:
        comments_page = paginator.page(1)
    
    serializer = CommentSerializer(comments_page, many=True, context={'request': request})
    
    return Response({
        'results': serializer.data,
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': comments_page.number,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def upload_comment_image(request):
    """
    Upload ảnh cho comment và trả về URL (tối đa 10MB)
    """
    if 'image' not in request.FILES:
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    image_file = request.FILES['image']
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if image_file.content_type not in allowed_types:
        return Response({'error': 'Invalid image type'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate file size (max 10MB)
    if image_file.size > 10 * 1024 * 1024:
        return Response({'error': 'Ảnh quá lớn (tối đa 10MB)'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Save to media/comment_images/
        from django.utils import timezone
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f"comment_images/{timestamp}_{image_file.name}"
        path = default_storage.save(filename, ContentFile(image_file.read()))
        
        # Return URL (relative path that works with both localhost and production)
        image_url = f"/media/{path}"
        
        return Response({
            'image_url': image_url,
            'filename': os.path.basename(path)
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
