from rest_framework.decorators import api_view, action, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.core.mail import EmailMessage
from django.conf import settings
from .models import Site, Feedback, Quiz, QuizAttempt, QuizBattle, QuizBattleParticipant, UserProfile, Achievement, UserAchievement, UserRole
from .serializers import SiteSerializer, FeedbackSerializer, QuizSerializer, QuizAttemptSerializer, QuizBattleSerializer, QuizBattleParticipantSerializer
from .authentication import CsrfExemptSessionAuthentication
import jwt
import base64
import logging

logger = logging.getLogger(__name__)


@csrf_exempt
@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Username và password là bắt buộc'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    if user:
        # Create simple token (in production, use JWT)
        token = base64.b64encode(f"{username}:{user.id}:{user.is_staff}:{user.is_superuser}".encode()).decode()
        
        return Response({
            'token': token,
            'user': {
                'username': user.username,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'email': user.email
            }
        })
    else:
        return Response({'error': 'Sai tên đăng nhập hoặc mật khẩu'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def sites_geojson(request):
    if request.method == 'GET':
        qs = Site.objects.all()
        features = []
        for s in qs:
            # Get the base geojson feature
            feature = s.geojson.copy() if isinstance(s.geojson, dict) else s.geojson
            
            # Ensure properties exist
            if 'properties' not in feature:
                feature['properties'] = {}
            
            # Add additional fields to properties
            feature['properties']['conservation_status'] = s.conservation_status
            feature['properties']['status_description'] = s.status_description
            feature['properties']['conduct'] = s.conduct
            
            features.append(feature)
        return Response({'type': 'FeatureCollection', 'features': features})
    
    elif request.method == 'POST':
        # Check if user has permission to create sites (only authenticated users with proper role)
        if not request.user.is_authenticated:
            return Response({'error': 'Yêu cầu đăng nhập để thêm địa điểm'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            user_role = request.user.role_info.role
            if user_role not in ['teacher', 'super_admin']:
                return Response({'error': 'Chỉ giáo viên và super admin mới có quyền thêm địa điểm'}, status=status.HTTP_403_FORBIDDEN)
        except:
            return Response({'error': 'Không có quyền truy cập'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = SiteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def site_delete(request, site_id):
    # Check if user has permission to delete sites
    try:
        user_role = request.user.role_info.role
        if user_role not in ['teacher', 'super_admin']:
            return Response({'error': 'Chỉ giáo viên và super admin mới có quyền xóa địa điểm'}, status=status.HTTP_403_FORBIDDEN)
    except:
        return Response({'error': 'Không có quyền truy cập'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        site = Site.objects.get(site_id=site_id)
        site.delete()
        return Response({'message': 'Đã xóa địa điểm thành công'}, status=status.HTTP_200_OK)
    except Site.DoesNotExist:
        return Response({'error': 'Không tìm thấy địa điểm'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def site_update(request, site_id):
    # Check if user has permission to update sites
    try:
        user_role = request.user.role_info.role
        if user_role not in ['teacher', 'super_admin']:
            return Response({'error': 'Chỉ giáo viên và super admin mới có quyền cập nhật địa điểm'}, status=status.HTTP_403_FORBIDDEN)
    except:
        return Response({'error': 'Không có quyền truy cập'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        site = Site.objects.get(site_id=site_id)
        serializer = SiteSerializer(site, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Site.DoesNotExist:
        return Response({'error': 'Không tìm thấy địa điểm'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def feedback_create(request):
    from django.utils import timezone
    from datetime import timedelta
    
    # Rate limiting: 5 phút/feedback per email (normalized)
    email = request.data.get('email', '').strip().lower() if request.data.get('email') else None
    if email:
        # Normalize email trong database để so sánh chính xác
        last_feedback = Feedback.objects.filter(
            email__iexact=email  # Case-insensitive exact match
        ).order_by('-created').first()
        
        if last_feedback:
            time_diff = timezone.now() - last_feedback.created
            if time_diff < timedelta(minutes=5):
                seconds_left = int((timedelta(minutes=5) - time_diff).total_seconds())
                minutes_left = (seconds_left // 60) + 1  # Round up to next minute
                return Response({
                    'error': f'Vui lòng chờ {minutes_left} phút trước khi gửi góp ý tiếp theo từ email này'
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    serializer = FeedbackSerializer(data=request.data)
    if serializer.is_valid():
        feedback = serializer.save()
        
        # Lấy thông tin địa điểm
        site = feedback.site
        site_name = site.name
        site_id = site.site_id
        
        # Tạo nội dung email
        subject = f"Feedback mới từ {feedback.site.name}"
        message = f"""
Có góp ý mới từ hệ thống quản lý di sản văn hóa:

Địa điểm: {site_name} (ID: {site_id})
Người góp ý: {feedback.name or 'Ẩn danh'}
Email: {feedback.email or 'Không cung cấp'}
Loại: {feedback.category}

Nội dung:
{feedback.message}

---
Thời gian: {feedback.created.strftime('%d/%m/%Y %H:%M:%S')}
        """
        
        try:
            # Lấy email từ SystemSettings
            from .models import SystemSettings
            system_settings = SystemSettings.get_settings()
            recipient_email = system_settings.feedback_email
            
            # Sử dụng EmailMessage để gửi kèm file đính kèm
            email = EmailMessage(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [recipient_email],
            )
            
            # Đính kèm ảnh nếu có
            if feedback.image:
                email.attach_file(feedback.image.path)
            
            email.send(fail_silently=False)
        except Exception:
            # Log error but don't fail the request
            import traceback
            traceback.print_exc()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Quiz ViewSets
class QuizViewSet(viewsets.ModelViewSet):
    """API ViewSet để quản lý quiz"""
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsTeacherOrSuperAdmin()]
        return [AllowAny()]
    
    def get_queryset(self):
        """Filter theo site_id nếu có"""
        queryset = Quiz.objects.all()
        site_id = self.request.query_params.get('site_id')
        if site_id:
            queryset = queryset.filter(site__site_id=site_id)
        return queryset
    
    @action(detail=False, methods=['get'])
    def check_attempts(self, request):
        """Kiểm tra xem user đã làm quiz nào chưa"""
        user_name = request.query_params.get('user_name')
        site_id = request.query_params.get('site_id')
        
        if not user_name:
            return Response({'error': 'Thiếu user_name'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Lấy tất cả quiz của site
        quizzes = Quiz.objects.filter(site__site_id=site_id) if site_id else Quiz.objects.all()
        
        # Lấy các attempts của user
        attempts = QuizAttempt.objects.filter(
            user_name=user_name,
            quiz__in=quizzes
        ).select_related('quiz')
        
        # Tạo dict: quiz_id -> attempt
        attempt_dict = {attempt.quiz_id: QuizAttemptSerializer(attempt).data for attempt in attempts}
        
        return Response(attempt_dict)
    
    @action(detail=True, methods=['post'])
    def submit_answer(self, request, pk=None):
        """Submit câu trả lời cho quiz"""
        from django.utils import timezone
        
        quiz = self.get_object()
        user_name = request.data.get('user_name', 'Anonymous')
        user_answer = request.data.get('user_answer')
        started_at = request.data.get('started_at')  # ISO string từ frontend
        
        if not user_answer or user_answer not in ['A', 'B', 'C', 'D']:
            return Response(
                {'error': 'Vui lòng chọn câu trả lời (A, B, C hoặc D)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kiểm tra xem user đã làm quiz này chưa
        existing_attempt = QuizAttempt.objects.filter(quiz=quiz, user_name=user_name).first()
        if existing_attempt:
            return Response(
                {
                    'error': 'Bạn đã làm câu hỏi này rồi',
                    'attempt': QuizAttemptSerializer(existing_attempt).data
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Tính thời gian làm bài
        time_taken = 0
        if started_at:
            try:
                from dateutil import parser
                start_time = parser.isoparse(started_at)
                end_time = timezone.now()
                time_taken = int((end_time - start_time).total_seconds())
            except Exception:
                pass  # Use default time_taken = 0
        
        is_correct = (user_answer == quiz.correct_answer)
        xp_earned = quiz.xp_reward if is_correct else 0
        
        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            user_name=user_name,
            user_answer=user_answer,
            is_correct=is_correct,
            xp_earned=xp_earned,
            started_at=started_at if started_at else timezone.now(),
            time_taken=time_taken
        )
        
        # Add XP to user profile and check achievements
        unlocked_achievements = []
        level_up_info = {}
        if xp_earned > 0:
            try:
                # Get or create user profile
                profile, created = UserProfile.objects.get_or_create(
                    user_name=user_name,
                    defaults={
                        'display_name': user_name,
                        'total_xp': 0,
                        'level': 1
                    }
                )
                
                # Add XP and level up
                old_level = profile.level
                old_xp = profile.total_xp
                profile.add_xp(xp_earned)
                new_level = profile.level
                
                level_up_info = {
                    'old_xp': old_xp,
                    'new_xp': profile.total_xp,
                    'old_level': old_level,
                    'new_level': new_level,
                    'leveled_up': new_level > old_level
                }
                
                # Check and unlock achievements
                unlocked_achievements = check_and_unlock_achievements(profile, user_name)
            except Exception as e:
                print(f"Error updating XP/achievements: {e}")
                pass  # Continue even if XP update fails
        
        serializer = QuizAttemptSerializer(attempt)
        response_data = {
            'is_correct': is_correct,
            'correct_answer': quiz.correct_answer,  # Always return correct answer for review
            'xp_earned': xp_earned,
            'attempt': serializer.data,
            'time_taken': time_taken
        }
        
        # Add level up info if available
        if level_up_info:
            response_data['level_info'] = level_up_info
        
        # Add unlocked achievements if any
        if unlocked_achievements:
            response_data['unlocked_achievements'] = unlocked_achievements
        
        return Response(response_data)


class QuizAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """API ViewSet để xem lịch sử làm quiz"""
    queryset = QuizAttempt.objects.all().order_by('-created')
    serializer_class = QuizAttemptSerializer
    
    def get_permissions(self):
        return [AllowAny()]
    
    def get_queryset(self):
        """Filter theo quiz_id nếu có"""
        queryset = QuizAttempt.objects.all().order_by('-created')
        quiz_id = self.request.query_params.get('quiz_id')
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        return queryset
    
    @action(detail=False, methods=['get'])
    def leaderboard(self, request):
        """Bảng xếp hạng học sinh theo điểm và thời gian"""
        from django.db.models import Count, Sum, Q
        
        site_id = request.query_params.get('site_id')
        
        # Lấy tất cả attempts
        attempts = QuizAttempt.objects.all()
        if site_id:
            attempts = attempts.filter(quiz__site__site_id=site_id)
        
        # Nhóm theo user_name và tính điểm
        leaderboard = attempts.values('user_name').annotate(
            total_questions=Count('id'),
            correct_answers=Count('id', filter=Q(is_correct=True)),
            total_time=Sum('time_taken'),
            total_xp=Sum('xp_earned')
        ).order_by('-total_xp', '-correct_answers', 'total_time')
        
        # Thêm thứ hạng
        ranked_leaderboard = []
        for rank, entry in enumerate(leaderboard, start=1):
            score_percentage = (entry['correct_answers'] / entry['total_questions'] * 100) if entry['total_questions'] > 0 else 0
            ranked_leaderboard.append({
                'rank': rank,
                'user_name': entry['user_name'],
                'total_questions': entry['total_questions'],
                'correct_answers': entry['correct_answers'],
                'wrong_answers': entry['total_questions'] - entry['correct_answers'],
                'score_percentage': round(score_percentage, 1),
                'total_xp': entry['total_xp'] or 0,
                'total_time': entry['total_time'] or 0,
                'average_time': round((entry['total_time'] or 0) / entry['total_questions'], 1) if entry['total_questions'] > 0 else 0
            })
        
        return Response(ranked_leaderboard)


class IsTeacherOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        try:
            role = request.user.role_info.role
            return role in ['teacher', 'super_admin']
        except Exception:
            return False

class FeedbackViewSet(viewsets.ModelViewSet):
    """API ViewSet để xem và xóa feedback (chỉ dành cho admin)"""
    queryset = Feedback.objects.all().order_by('-created')
    serializer_class = FeedbackSerializer
    http_method_names = ['get', 'delete', 'head', 'options']  # Chỉ cho phép GET và DELETE

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAuthenticated(), IsTeacherOrSuperAdmin()]
        return [AllowAny()]


class QuizBattleViewSet(viewsets.ModelViewSet):
    """API ViewSet để quản lý Quiz Battles"""
    queryset = QuizBattle.objects.all().order_by('-created_at')
    serializer_class = QuizBattleSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'create_random_battle', 'create_battle', 'start_battle', 'end_battle']:
            return [IsAuthenticated(), IsTeacherOrSuperAdmin()]
        return [AllowAny()]
    
    def list(self, request, *args, **kwargs):
        """Override list to auto-update battle status based on time"""
        from django.utils import timezone
        now = timezone.now()
        
        # Auto-start pending battles that have reached scheduled time
        pending_battles = QuizBattle.objects.filter(
            status='pending',
            scheduled_start_time__lte=now
        )
        for battle in pending_battles:
            battle.status = 'in_progress'
            battle.save()
        
        # Auto-complete in_progress battles that have exceeded duration
        in_progress_battles = QuizBattle.objects.filter(status='in_progress')
        for battle in in_progress_battles:
            end_time = battle.scheduled_start_time + timezone.timedelta(minutes=battle.duration_minutes)
            if now >= end_time:
                battle.status = 'completed'
                battle.save()
        
        return super().list(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'])
    def create_random_battle(self, request):
        """
        Tạo battle với 4 người chơi random từ leaderboard
        Body: {
            "scheduled_start_time": "2024-01-01T10:00:00Z",
            "duration_minutes": 10,
            "question_count": 6
        }
        """
        from django.utils import timezone
        from django.db.models import Sum, Q
        import random
        
        scheduled_start_time = request.data.get('scheduled_start_time')
        duration_minutes = request.data.get('duration_minutes', 10)
        question_count = request.data.get('question_count', 6)
        
        if not scheduled_start_time:
            return Response(
                {'error': 'scheduled_start_time là bắt buộc'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Lấy top users từ leaderboard (có XP > 0)
        leaderboard = QuizAttempt.objects.values('user_name').annotate(
            total_xp=Sum('xp_earned')
        ).filter(total_xp__gt=0).order_by('-total_xp')
        
        if leaderboard.count() < 4:
            return Response(
                {'error': f'Cần ít nhất 4 người chơi có điểm. Hiện có {leaderboard.count()} người.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Random 4 người từ top 20 (hoặc ít hơn nếu không đủ)
        top_users = list(leaderboard[:20])
        selected_users = random.sample(top_users, min(4, len(top_users)))
        participant_names = [u['user_name'] for u in selected_users]
        
        # Random 6 câu hỏi từ tất cả các quiz
        all_quizzes = list(Quiz.objects.values_list('id', flat=True))
        if len(all_quizzes) < question_count:
            return Response(
                {'error': f'Không đủ câu hỏi. Cần {question_count} câu, hiện có {len(all_quizzes)} câu.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        selected_questions = random.sample(all_quizzes, question_count)
        
        # Tạo battle
        battle = QuizBattle.objects.create(
            scheduled_start_time=scheduled_start_time,
            duration_minutes=duration_minutes,
            status='pending',
            questions=selected_questions,
            participants=participant_names
        )
        
        # Tạo battle participants
        for username in participant_names:
            QuizBattleParticipant.objects.create(
                battle=battle,
                user_name=username
            )
        
        serializer = self.get_serializer(battle)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def create_battle(self, request):
        """
        Tạo battle với danh sách người chơi được chọn từ leaderboard
        Body: {
            "scheduled_start_time": "2024-01-01T10:00:00Z",
            "duration_minutes": 10,
            "question_count": 6,
            "participants": ["user1", "user2", "user3", "user4"]
        }
        """
        from django.utils import timezone
        from django.db.models import Sum
        import random
        
        scheduled_start_time = request.data.get('scheduled_start_time')
        duration_minutes = request.data.get('duration_minutes', 10)
        question_count = request.data.get('question_count', 6)
        participants = request.data.get('participants', [])
        
        if not scheduled_start_time:
            return Response(
                {'error': 'scheduled_start_time là bắt buộc'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not participants or len(participants) < 2:
            return Response(
                {'error': 'Cần ít nhất 2 người chơi'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(participants) > 8:
            return Response(
                {'error': 'Tối đa 8 người chơi'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kiểm tra các user có tồn tại trong hệ thống không (đã đăng ký)
        from django.contrib.auth.models import User
        existing_users = User.objects.filter(username__in=participants).values_list('username', flat=True)
        
        invalid_users = [user for user in participants if user not in existing_users]
        if invalid_users:
            return Response(
                {'error': f'Các user sau không tồn tại trong hệ thống: {", ".join(invalid_users)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Random câu hỏi từ tất cả các quiz
        all_quizzes = list(Quiz.objects.values_list('id', flat=True))
        if len(all_quizzes) < question_count:
            return Response(
                {'error': f'Không đủ câu hỏi. Cần {question_count} câu, hiện có {len(all_quizzes)} câu.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        selected_questions = random.sample(all_quizzes, question_count)
        
        # Tạo battle
        battle = QuizBattle.objects.create(
            scheduled_start_time=scheduled_start_time,
            duration_minutes=duration_minutes,
            status='pending',
            questions=selected_questions,
            participants=participants
        )
        
        # Tạo battle participants
        for username in participants:
            QuizBattleParticipant.objects.create(
                battle=battle,
                user_name=username
            )
        
        serializer = self.get_serializer(battle)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def start_battle(self, request, pk=None):
        """Bắt đầu battle (chuyển status sang in_progress)"""
        from django.utils import timezone
        
        battle = self.get_object()
        
        if battle.status != 'pending':
            return Response(
                {'error': f'Battle đang ở trạng thái {battle.status}, không thể bắt đầu'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        battle.status = 'in_progress'
        battle.scheduled_start_time = timezone.now()  # Cập nhật thời gian bắt đầu thực tế
        battle.save()
        
        serializer = self.get_serializer(battle)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def end_battle(self, request, pk=None):
        """
        Kết thúc battle sớm (admin/giáo viên)
        Yêu cầu: user phải là staff hoặc superuser
        """
        from django.utils import timezone
        
        # Kiểm tra đăng nhập
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Yêu cầu đăng nhập'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Chỉ admin/staff mới được kết thúc battle
        if not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {'error': 'Chỉ admin/giáo viên mới có quyền kết thúc battle'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        battle = self.get_object()
        
        if battle.status == 'completed':
            return Response(
                {'error': 'Battle đã kết thúc rồi'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        battle.status = 'completed'
        battle.save()
        
        # Cập nhật ranks cuối cùng
        self._update_battle_ranks(battle)
        
        serializer = self.get_serializer(battle)
        return Response({
            'message': 'Đã kết thúc battle thành công',
            'battle': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def live_leaderboard(self, request, pk=None):
        """Lấy bảng xếp hạng realtime của battle"""
        battle = self.get_object()
        participants = battle.battle_participants.all().order_by('-score', 'time_completed')
        
        leaderboard = []
        for idx, p in enumerate(participants, 1):
            leaderboard.append({
                'rank': idx,
                'user_name': p.user_name,
                'score': p.score,
                'correct_answers': p.correct_answers,
                'time_completed': p.time_completed,
                'finished': p.finished_at is not None,
            })
        
        return Response({
            'battle_id': battle.id,
            'status': battle.status,
            'leaderboard': leaderboard
        })
    
    @action(detail=True, methods=['get'])
    def my_progress(self, request, pk=None):
        """Lấy tiến độ của user trong battle (answers, results)"""
        battle = self.get_object()
        user_name = request.query_params.get('user_name')
        
        if not user_name:
            return Response(
                {'error': 'user_name là bắt buộc'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            participant = battle.battle_participants.get(user_name=user_name)
        except QuizBattleParticipant.DoesNotExist:
            return Response(
                {'error': 'Bạn không thuộc battle này'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Chuyển đổi answers từ backend format sang frontend format
        answers = {}
        results = {}
        
        for quiz_id_str, answer_data in participant.answers.items():
            quiz_id = int(quiz_id_str)
            answers[quiz_id] = answer_data['answer']
            results[quiz_id] = answer_data['is_correct']
        
        return Response({
            'answers': answers,
            'results': results,
            'score': participant.score,
            'correct_answers': participant.correct_answers,
        })
    
    @action(detail=True, methods=['get'])
    def current_question_status(self, request, pk=None):
        """Lấy trạng thái câu hỏi hiện tại của battle"""
        battle = self.get_object()
        
        if battle.status != 'in_progress':
            return Response({
                'battle_id': battle.id,
                'status': battle.status,
                'current_question_index': 0,
                'question_solved': False,
                'solved_by': None,
                'correct_answer': None
            })
        
        # Tìm câu hỏi hiện tại (câu hỏi đầu tiên chưa được ai trả lời đúng)
        current_question_index = 0
        question_solved = False
        solved_by = None
        correct_answer = None
        
        for idx, quiz_id in enumerate(battle.questions):
            # Kiểm tra xem có ai trả lời đúng câu này chưa
            participants_answered_correct = battle.battle_participants.filter(
                answers__has_key=str(quiz_id)
            ).filter(
                answers__contains={str(quiz_id): {'is_correct': True}}
            )
            
            if participants_answered_correct.exists():
                # Có người trả lời đúng câu này
                solved_by = participants_answered_correct.first().user_name
                try:
                    quiz = Quiz.objects.get(id=quiz_id)
                    correct_answer = quiz.correct_answer
                except Quiz.DoesNotExist:
                    correct_answer = None
                question_solved = True
                current_question_index = idx
                break
            else:
                # Chưa có ai trả lời đúng, đây là câu hỏi hiện tại
                current_question_index = idx
                break
        
        return Response({
            'battle_id': battle.id,
            'status': battle.status,
            'current_question_index': current_question_index,
            'question_solved': question_solved,
            'solved_by': solved_by,
            'correct_answer': correct_answer,
            'total_questions': len(battle.questions)
        })
    
    @action(detail=True, methods=['post'])
    def submit_answer(self, request, pk=None):
        """
        Submit answer cho 1 câu hỏi trong battle
        Body: {
            "user_name": "...",
            "quiz_id": 123,
            "answer": "A",
            "time_taken": 5
        }
        """
        battle = self.get_object()
        
        if battle.status != 'in_progress':
            return Response(
                {'error': 'Battle chưa bắt đầu hoặc đã kết thúc'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_name = request.data.get('user_name')
        quiz_id = request.data.get('quiz_id')
        answer = request.data.get('answer')
        time_taken = request.data.get('time_taken', 0)
        
        if not all([user_name, quiz_id, answer]):
            return Response(
                {'error': 'user_name, quiz_id, answer là bắt buộc'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kiểm tra user có trong battle không
        if user_name not in battle.participants:
            return Response(
                {'error': 'Bạn không thuộc battle này'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Kiểm tra quiz có trong battle không
        if quiz_id not in battle.questions:
            return Response(
                {'error': 'Câu hỏi này không thuộc battle'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Lấy participant
        try:
            participant = battle.battle_participants.get(user_name=user_name)
        except QuizBattleParticipant.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy participant'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Kiểm tra đã trả lời câu này chưa
        if str(quiz_id) in participant.answers:
            return Response(
                {'error': 'Bạn đã trả lời câu này rồi'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Lấy quiz và check đáp án
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy câu hỏi'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        is_correct = (answer.upper() == quiz.correct_answer.upper())
        
        # Cập nhật participant
        participant.answers[str(quiz_id)] = {
            'answer': answer,
            'is_correct': is_correct,
            'time_taken': time_taken
        }
        
        if is_correct:
            participant.score += quiz.xp_reward
            participant.correct_answers += 1
        
        # Cập nhật tổng thời gian
        if participant.time_completed is None:
            participant.time_completed = 0
        participant.time_completed += time_taken
        
        # Kiểm tra đã hoàn thành hết câu hỏi chưa
        if len(participant.answers) == len(battle.questions):
            from django.utils import timezone
            participant.finished_at = timezone.now()
        
        participant.save()
        
        # Update ranks
        self._update_battle_ranks(battle)
        
        return Response({
            'is_correct': is_correct,
            'correct_answer': quiz.correct_answer,
            'score': participant.score,
            'answers_completed': len(participant.answers),
            'total_questions': len(battle.questions)
        })
    
    def _update_battle_ranks(self, battle):
        """Cập nhật rank cho tất cả participants"""
        participants = battle.battle_participants.all().order_by('-score', 'time_completed')
        for idx, p in enumerate(participants, 1):
            p.rank = idx
            p.save(update_fields=['rank'])


class QuizBattleParticipantViewSet(viewsets.ReadOnlyModelViewSet):
    """API ViewSet để xem participants của battles"""
    queryset = QuizBattleParticipant.objects.all().order_by('-score')
    serializer_class = QuizBattleParticipantSerializer
    
    def get_permissions(self):
        return [AllowAny()]
    
    @action(detail=False, methods=['get'])
    def my_battles(self, request):
        """Lấy danh sách battles của user"""
        user_name = request.query_params.get('user_name')
        
        if not user_name:
            return Response(
                {'error': 'user_name là bắt buộc'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        participants = self.queryset.filter(user_name=user_name)
        serializer = self.get_serializer(participants, many=True)
        return Response(serializer.data)


# User Profile Views
@api_view(['GET', 'POST'])
def user_profile(request):
    """Lấy hoặc tạo profile của user"""
    # GET request: allow anonymous users to view profiles
    # POST request: require authentication to update profile
    if request.method == 'POST' and not request.user.is_authenticated:
        return Response({'error': 'Yêu cầu đăng nhập để cập nhật profile'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Ưu tiên lấy từ authenticated user, nếu không có thì lấy từ query parameter
    if request.user.is_authenticated:
        user_name = request.user.username
    else:
        user_name = request.data.get('user_name') if request.method == 'POST' else request.query_params.get('user_name')
    
    if not user_name:
        return Response({'error': 'user_name là bắt buộc hoặc phải đăng nhập'}, status=status.HTTP_400_BAD_REQUEST)
    
    profile, created = UserProfile.objects.get_or_create(
        user_name=user_name,
        defaults={
            'display_name': user_name,
            'total_xp': 0,
            'level': 1
        }
    )
    
    if request.method == 'GET':
        # Lấy User object để lấy email, role, class_name, school_name
        try:
            user = User.objects.get(username=user_name)
            user_email = user.email
            # Lấy thông tin từ UserRole
            try:
                role_info = user.role_info
                class_name = role_info.class_name or ''
                school_name = role_info.school_name or ''
                user_role = role_info.role
            except:
                class_name = ''
                school_name = ''
                user_role = ''
        except User.DoesNotExist:
            user_email = ''
            class_name = ''
            school_name = ''
            user_role = ''
        
        # Tính toán level và XP
        xp_for_next_level = profile.xp_for_next_level
        current_level_xp = profile.current_level_xp
        xp_progress_percentage = profile.xp_progress_percentage
        
        # Lấy achievements
        user_achievements = UserAchievement.objects.filter(user=profile).select_related('achievement')
        achievements_data = [{
            'id': ua.achievement.id,
            'name': ua.achievement.name,
            'description': ua.achievement.description,
            'icon': ua.achievement.icon,
            'rarity': ua.achievement.rarity,
            'unlocked_at': ua.unlocked_at
        } for ua in user_achievements]
        
        return Response({
            'user_name': profile.user_name,
            'email': user_email,
            'display_name': profile.display_name,
            'avatar': profile.avatar.url if profile.avatar else None,
            'bio': profile.bio,
            'total_xp': profile.total_xp,
            'level': profile.level,
            'xp_for_next_level': xp_for_next_level,
            'current_level_xp': current_level_xp,
            'xp_progress_percentage': round(xp_progress_percentage, 1),
            'joined_at': profile.joined_at,
            'last_active': profile.last_active,
            'achievements': achievements_data,
            'achievement_count': len(achievements_data),
            'class_name': class_name,
            'school_name': school_name,
            'role': user_role
        })
    
    elif request.method == 'POST':
        # Update profile
        display_name = request.data.get('display_name')
        bio = request.data.get('bio')
        
        if display_name:
            profile.display_name = display_name
        if bio is not None:
            profile.bio = bio
        
        # Handle avatar upload
        if 'avatar' in request.FILES:
            profile.avatar = request.FILES['avatar']
        
        profile.save()
        
        return Response({
            'message': 'Profile updated successfully',
            'avatar': profile.avatar.url if profile.avatar else None
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_user_xp(request):
    """Thêm XP cho user và kiểm tra achievements"""
    # Check if user has permission to add XP
    try:
        user_role = request.user.role_info.role
        if user_role not in ['teacher', 'super_admin']:
            return Response({'error': 'Chỉ giáo viên và super admin mới có quyền thêm XP'}, status=status.HTTP_403_FORBIDDEN)
    except:
        return Response({'error': 'Không có quyền truy cập'}, status=status.HTTP_403_FORBIDDEN)
    
    user_name = request.data.get('user_name')
    xp_amount = request.data.get('xp_amount')
    
    if not user_name or xp_amount is None:
        return Response({'error': 'user_name và xp_amount là bắt buộc'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        xp_amount = int(xp_amount)
    except ValueError:
        return Response({'error': 'xp_amount phải là số'}, status=status.HTTP_400_BAD_REQUEST)
    
    profile, created = UserProfile.objects.get_or_create(
        user_name=user_name,
        defaults={
            'display_name': user_name,
            'total_xp': 0,
            'level': 1
        }
    )
    
    old_level = profile.level
    profile.add_xp(xp_amount)
    new_level = profile.level
    
    # Check achievements
    unlocked_achievements = check_and_unlock_achievements(profile, user_name)
    
    return Response({
        'old_xp': profile.total_xp - xp_amount,
        'new_xp': profile.total_xp,
        'old_level': old_level,
        'new_level': new_level,
        'leveled_up': new_level > old_level,
        'unlocked_achievements': unlocked_achievements
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def leaderboard(request):
    """Bảng xếp hạng users theo level, sau đó theo XP"""
    profiles = UserProfile.objects.all().order_by('-level', '-total_xp')
    
    leaderboard_data = []
    for rank, profile in enumerate(profiles, 1):
        leaderboard_data.append({
            'rank': rank,
            'user_name': profile.user_name,
            'display_name': profile.display_name,
            'avatar': profile.avatar.url if profile.avatar else None,
            'total_xp': profile.total_xp,
            'level': profile.level,
            'joined_at': profile.joined_at
        })
    
    return Response(leaderboard_data)


@api_view(['GET'])
@permission_classes([AllowAny])
def achievements_list(request):
    """Danh sách tất cả achievements"""
    achievements = Achievement.objects.all().order_by('rarity', 'name')
    
    achievements_data = []
    for achievement in achievements:
        achievements_data.append({
            'id': achievement.id,
            'name': achievement.name,
            'description': achievement.description,
            'icon': achievement.icon,
            'achievement_type': achievement.achievement_type,
            'xp_reward': achievement.xp_reward,
            'rarity': achievement.rarity,
            'requirement': achievement.requirement
        })
    
    return Response(achievements_data)


def check_and_unlock_achievements(profile, user_name):
    """Kiểm tra và unlock achievements cho user"""
    from django.db.models import Count, Sum, Q
    
    unlocked = []
    
    # Get user stats
    quiz_attempts = QuizAttempt.objects.filter(user_name=user_name)
    total_quizzes = quiz_attempts.count()
    correct_answers = quiz_attempts.filter(is_correct=True).count()
    total_xp = quiz_attempts.aggregate(total=Sum('xp_earned'))['total'] or 0
    
    # Battle stats
    battle_participants = QuizBattleParticipant.objects.filter(user_name=user_name)
    battle_wins = battle_participants.filter(rank=1).count()
    
    # Unique sites explored
    unique_sites = QuizAttempt.objects.filter(user_name=user_name).values('quiz__site').distinct().count()
    
    # Fastest time (under 5 seconds)
    fastest_time = quiz_attempts.filter(time_taken__lte=5, is_correct=True).exists()
    
    # Perfect battle score
    perfect_battle = battle_participants.filter(correct_answers__gte=5).exists()  # Assuming 5+ questions
    
    # Early morning quiz (before 8 AM)
    from django.utils import timezone
    early_morning = quiz_attempts.filter(created__hour__lt=8).exists()
    
    # Check each achievement
    achievements = Achievement.objects.all()
    for achievement in achievements:
        # Skip if already unlocked
        if UserAchievement.objects.filter(user=profile, achievement=achievement).exists():
            continue
        
        unlock = False
        requirement = achievement.requirement
        
        if achievement.achievement_type == 'first_quiz':
            unlock = total_quizzes >= (requirement.get('total_quizzes', 1))
        elif achievement.achievement_type == 'quiz_master':
            if 'total_quizzes' in requirement:
                unlock = total_quizzes >= requirement['total_quizzes']
            elif 'level' in requirement:
                unlock = profile.level >= requirement['level']
        elif achievement.achievement_type == 'speed_demon':
            unlock = fastest_time
        elif achievement.achievement_type == 'perfect_score':
            unlock = perfect_battle
        elif achievement.achievement_type == 'battle_winner':
            unlock = battle_wins >= (requirement.get('battle_wins', 1))
        elif achievement.achievement_type == 'explorer':
            unlock = unique_sites >= (requirement.get('unique_sites', 5))
        elif achievement.achievement_type == 'early_bird':
            unlock = early_morning
        
        if unlock:
            UserAchievement.objects.create(user=profile, achievement=achievement)
            profile.add_xp(achievement.xp_reward)
            unlocked.append({
                'id': achievement.id,
                'name': achievement.name,
                'description': achievement.description,
                'icon': achievement.icon,
                'rarity': achievement.rarity,
                'xp_reward': achievement.xp_reward
            })
    
    return unlocked


@api_view(['GET'])
@permission_classes([AllowAny])
def get_system_settings(request):
    """Lấy cấu hình hệ thống"""
    from .models import SystemSettings
    settings = SystemSettings.get_settings()
    return Response({
        'feedback_email': settings.feedback_email,
        'updated_at': settings.updated_at
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_feedback_email(request):
    from .models import SystemSettings

    try:
        role_info = request.user.role_info
        if role_info.role not in ['teacher', 'super_admin']:
            return Response({'error': 'Không có quyền truy cập'}, status=status.HTTP_403_FORBIDDEN)
    except:
        return Response({'error': 'Không có quyền truy cập'}, status=status.HTTP_403_FORBIDDEN)

    new_email = request.data.get('feedback_email')
    if not new_email:
        return Response({'error': 'Email là bắt buộc'}, status=status.HTTP_400_BAD_REQUEST)

    if '@' not in new_email or '.' not in new_email:
        return Response({'error': 'Email không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)

    settings = SystemSettings.get_settings()
    settings.feedback_email = new_email
    settings.updated_by = request.user
    settings.save()

    return Response({
        'message': 'Cập nhật email thành công',
        'feedback_email': settings.feedback_email
    })
