from django.db import models
from django.contrib.auth.models import User


class UserRole(models.Model):
    """Extend Django User with role information"""
    ROLE_CHOICES = [
        ('student', 'Học sinh'),
        ('tourist', 'Khách du lịch'),
        ('teacher', 'Giáo viên'),
        ('super_admin', 'Super Admin'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='role_info')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    phone = models.CharField(max_length=20, blank=True)
    organization = models.CharField(max_length=100, blank=True)
    class_name = models.CharField(max_length=100, blank=True, verbose_name="Tên lớp")
    school_name = models.CharField(max_length=200, blank=True, verbose_name="Tên trường")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


class Site(models.Model):
    CONSERVATION_STATUS_CHOICES = [
        ('critical', 'Critical - Nguy cấp'),
        ('watch', 'Watch - Cần quan tâm'),
        ('good', 'Good - Tốt'),
    ]
    
    site_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    geojson = models.JSONField()
    image_urls = models.JSONField(default=list, blank=True)  # Danh sách URLs hình ảnh
    
    # Conservation status
    conservation_status = models.CharField(
        max_length=20,
        choices=CONSERVATION_STATUS_CHOICES,
        default='good'
    )
    status_description = models.TextField(blank=True, help_text="Mô tả tình trạng bảo tồn")
    
    # Rules of Conduct
    conduct = models.JSONField(
        default=dict,
        blank=True,
        help_text="JSON format: {dos: [], donts: [], lawExcerpt: '', lawLink: ''}"
    )
    
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Feedback(models.Model):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='feedbacks')
    name = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    category = models.CharField(max_length=50)
    message = models.TextField()
    image = models.ImageField(upload_to='feedback_images/', blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for {self.site.site_id} at {self.created}"


class Quiz(models.Model):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='quizzes')
    question = models.TextField()
    option_a = models.CharField(max_length=255)
    option_b = models.CharField(max_length=255)
    option_c = models.CharField(max_length=255)
    option_d = models.CharField(max_length=255)
    correct_answer = models.CharField(max_length=1, choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')])
    xp_reward = models.IntegerField(default=10, help_text="Số điểm XP nhận được khi trả lời đúng")
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Quiz for {self.site.name}: {self.question[:50]}"


class QuizAttempt(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    user_name = models.CharField(max_length=200, blank=True)
    user_answer = models.CharField(max_length=1)
    is_correct = models.BooleanField()
    xp_earned = models.IntegerField(default=0, help_text="Số XP kiếm được (0 nếu sai)")
    started_at = models.DateTimeField(null=True, blank=True)  # Thời gian bắt đầu
    completed_at = models.DateTimeField(auto_now_add=True)  # Thời gian hoàn thành
    time_taken = models.IntegerField(default=0)  # Số giây để trả lời
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Mỗi user chỉ được làm 1 lần cho mỗi quiz
        unique_together = [['quiz', 'user_name']]

    def __str__(self):
        return f"{self.user_name or 'Anonymous'} - {self.quiz.question[:30]} - {'Correct' if self.is_correct else 'Wrong'}"


class QuizBattle(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Chờ bắt đầu'),
        ('in_progress', 'Đang diễn ra'),
        ('completed', 'Đã kết thúc'),
        ('cancelled', 'Đã hủy'),
    ]
    
    created_at = models.DateTimeField(auto_now_add=True)
    scheduled_start_time = models.DateTimeField(help_text="Thời gian bắt đầu trận đấu")
    duration_minutes = models.IntegerField(default=10, help_text="Thời gian làm bài (phút)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    questions = models.JSONField(help_text="List of quiz IDs [quiz_id1, quiz_id2, ...]")
    participants = models.JSONField(help_text="List of usernames [username1, username2, ...]")
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Battle {self.id} - {self.scheduled_start_time.strftime('%Y-%m-%d %H:%M')}"


class QuizBattleParticipant(models.Model):
    battle = models.ForeignKey(QuizBattle, on_delete=models.CASCADE, related_name='battle_participants')
    user_name = models.CharField(max_length=200)
    score = models.IntegerField(default=0, help_text="Tổng điểm")
    correct_answers = models.IntegerField(default=0, help_text="Số câu đúng")
    total_answered = models.IntegerField(default=0, help_text="Tổng số câu đã trả lời")
    time_completed = models.IntegerField(null=True, blank=True, help_text="Tổng thời gian (giây)")
    answers = models.JSONField(default=dict, help_text="Quiz ID -> {answer, is_correct, time_taken}")
    rank = models.IntegerField(null=True, blank=True, help_text="Hạng (1-4)")
    joined_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('battle', 'user_name')
        ordering = ['-total_answered', '-correct_answers', 'time_completed']
    
    def save(self, *args, **kwargs):
        self.total_answered = len(self.answers) if self.answers else 0
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user_name} - Battle {self.battle.id} (Rank {self.rank})"


class UserProfile(models.Model):
    user_name = models.CharField(max_length=200, unique=True, help_text="Tên người dùng")
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, help_text="Ảnh đại diện")
    total_xp = models.IntegerField(default=0, help_text="Tổng số XP")
    level = models.IntegerField(default=1, help_text="Cấp độ hiện tại")
    display_name = models.CharField(max_length=200, blank=True, help_text="Tên hiển thị")
    bio = models.TextField(blank=True, help_text="Tiểu sử")
    joined_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-total_xp', '-level']
    
    def __str__(self):
        return f"{self.user_name} (Level {self.level})"
    
    @staticmethod
    def xp_required_for_level(level):
        """Tính tổng XP cần thiết để đạt level này"""
        # Level 1: 0 XP, Level 2: 100 XP, Level 3: 300 XP (100+200), ...
        # Công thức: sum(i * 100 for i in range(1, level))
        total = 0
        for i in range(1, level):
            total += i * 100
        return total
    
    @property
    def xp_for_next_level(self):
        """XP cần thiết cho level tiếp theo"""
        return self.level * 100  # Level hiện tại * 100
    
    @property
    def xp_for_current_level(self):
        """Tổng XP cần để đạt level hiện tại"""
        return UserProfile.xp_required_for_level(self.level)
    
    @property
    def current_level_xp(self):
        """XP hiện tại trong level này (0 đến xp_for_next_level)"""
        return self.total_xp - self.xp_for_current_level
    
    @property
    def xp_progress_percentage(self):
        """Phần trăm tiến độ level"""
        if self.xp_for_next_level == 0:
            return 100
        return min(100, (self.current_level_xp / self.xp_for_next_level) * 100)
    
    def save(self, *args, **kwargs):
        """Override save to auto-calculate level based on total_xp"""
        # Tính level mới dựa trên total_xp
        new_level = 1
        while self.total_xp >= UserProfile.xp_required_for_level(new_level + 1):
            new_level += 1
        
        self.level = new_level
        super().save(*args, **kwargs)
    
    def add_xp(self, xp_amount):
        """Thêm XP và tự động cập nhật level"""
        self.total_xp += xp_amount
        self.save()  # This will trigger level calculation in save()


class Achievement(models.Model):
    ACHIEVEMENT_TYPES = [
        ('quiz_master', 'Quiz Master'),
        ('speed_demon', 'Speed Demon'),
        ('battle_winner', 'Battle Winner'),
        ('explorer', 'Explorer'),
        ('first_quiz', 'First Quiz'),
        ('streak_master', 'Streak Master'),
        ('perfect_score', 'Perfect Score'),
        ('early_bird', 'Early Bird'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    icon = models.CharField(max_length=50, help_text="Icon name (lucide-react)")
    achievement_type = models.CharField(max_length=20, choices=ACHIEVEMENT_TYPES)
    xp_reward = models.IntegerField(default=50, help_text="XP thưởng khi đạt được")
    requirement = models.JSONField(help_text="Điều kiện đạt được (JSON)")
    rarity = models.CharField(max_length=20, choices=[
        ('common', 'Common'),
        ('rare', 'Rare'),
        ('epic', 'Epic'),
        ('legendary', 'Legendary'),
    ], default='common')
    
    def __str__(self):
        return self.name


class UserAchievement(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    unlocked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'achievement')
        ordering = ['-unlocked_at']
    
    def __str__(self):
        return f"{self.user.user_name} - {self.achievement.name}"


class Comment(models.Model):
    """Tourist/Student comments on heritage sites"""
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='comments')
    user_name = models.CharField(max_length=200, help_text="Tên người dùng (tourist/student)")
    content = models.TextField(help_text="Nội dung bình luận")
    images = models.JSONField(default=list, blank=True, help_text="Danh sách URLs hình ảnh (tối đa 3)")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_reported = models.BooleanField(default=False, help_text="Đã bị báo cáo")
    report_count = models.IntegerField(default=0, help_text="Số lần báo cáo")
    reported_by = models.JSONField(default=list, blank=True, help_text="Danh sách user đã báo cáo")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, help_text="User đã đăng nhập (nếu có)")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['site', '-created_at']),
            models.Index(fields=['user_name', '-created_at']),
            models.Index(fields=['is_reported']),
        ]
    
    def __str__(self):
        return f"{self.user_name} - {self.site.name} ({self.created_at.strftime('%Y-%m-%d')})"


class SystemSettings(models.Model):
    """Cấu hình hệ thống - chỉ có 1 record duy nhất"""
    feedback_email = models.EmailField(
        default='admin@example.com',
        help_text="Email nhận phản hồi từ người dùng"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        verbose_name = "Cấu hình hệ thống"
        verbose_name_plural = "Cấu hình hệ thống"
    
    def __str__(self):
        return f"System Settings (Email: {self.feedback_email})"
    
    @classmethod
    def get_settings(cls):
        """Lấy hoặc tạo settings duy nhất"""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings