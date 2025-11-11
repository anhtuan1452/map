from rest_framework import serializers
from .models import Site, Feedback, Quiz, QuizAttempt, QuizBattle, QuizBattleParticipant, UserProfile, Achievement, UserAchievement


class SiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = ('site_id', 'name', 'geojson', 'image_urls', 'conservation_status', 'status_description', 'conduct', 'created', 'updated')
        read_only_fields = ('created', 'updated')


class FeedbackSerializer(serializers.ModelSerializer):
    site_id = serializers.CharField(write_only=True)
    site = serializers.PrimaryKeyRelatedField(read_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    image = serializers.ImageField(required=False, allow_null=True)
    site_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Feedback
        fields = ('id', 'site', 'site_id', 'site_name', 'name', 'email', 'category', 'message', 'image', 'created')
        read_only_fields = ('id', 'created', 'site')
    
    def get_site_name(self, obj):
        return obj.site.name
    
    def create(self, validated_data):
        site_id = validated_data.pop('site_id')
        try:
            site = Site.objects.get(site_id=site_id)
            validated_data['site'] = site
            return super().create(validated_data)
        except Site.DoesNotExist:
            raise serializers.ValidationError({'site_id': f'Không tìm thấy địa điểm với ID: {site_id}'})


class QuizSerializer(serializers.ModelSerializer):
    site_id = serializers.CharField(write_only=True, required=False)
    site_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ('id', 'site', 'site_id', 'site_name', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'xp_reward', 'created', 'updated')
        read_only_fields = ('id', 'created', 'updated', 'site')
    
    def get_site_name(self, obj):
        return obj.site.name
    
    def create(self, validated_data):
        site_id = validated_data.pop('site_id', None)
        if site_id:
            try:
                site = Site.objects.get(site_id=site_id)
                validated_data['site'] = site
            except Site.DoesNotExist:
                raise serializers.ValidationError({'site_id': f'Không tìm thấy địa điểm với ID: {site_id}'})
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        site_id = validated_data.pop('site_id', None)
        if site_id:
            try:
                site = Site.objects.get(site_id=site_id)
                validated_data['site'] = site
            except Site.DoesNotExist:
                raise serializers.ValidationError({'site_id': f'Không tìm thấy địa điểm với ID: {site_id}'})
        return super().update(instance, validated_data)


class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_question = serializers.CharField(source='quiz.question', read_only=True)
    quiz_site_name = serializers.CharField(source='quiz.site.name', read_only=True)
    correct_answer = serializers.CharField(source='quiz.correct_answer', read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = ('id', 'quiz', 'quiz_question', 'quiz_site_name', 'user_name', 'user_answer', 'is_correct', 'xp_earned', 'correct_answer', 'started_at', 'completed_at', 'time_taken', 'created')
        read_only_fields = ('id', 'is_correct', 'xp_earned', 'completed_at', 'created')


class QuizBattleSerializer(serializers.ModelSerializer):
    participant_count = serializers.SerializerMethodField()
    question_details = serializers.SerializerMethodField()
    
    class Meta:
        model = QuizBattle
        fields = ('id', 'created_at', 'scheduled_start_time', 'duration_minutes', 'status', 'questions', 'participants', 'participant_count', 'question_details')
        read_only_fields = ('id', 'created_at')
    
    def get_participant_count(self, obj):
        return len(obj.participants) if obj.participants else 0
    
    def get_question_details(self, obj):
        """Return question details without correct_answer"""
        if not obj.questions:
            return []
        quizzes = Quiz.objects.filter(id__in=obj.questions)
        return [
            {
                'id': q.id,
                'question': q.question,
                'option_a': q.option_a,
                'option_b': q.option_b,
                'option_c': q.option_c,
                'option_d': q.option_d,
                'site_name': q.site.name,
                'xp_reward': q.xp_reward,
            }
            for q in quizzes
        ]


class QuizBattleParticipantSerializer(serializers.ModelSerializer):
    battle_id = serializers.IntegerField(source='battle.id', read_only=True)
    battle_status = serializers.CharField(source='battle.status', read_only=True)
    
    class Meta:
        model = QuizBattleParticipant
        fields = ('id', 'battle', 'battle_id', 'battle_status', 'user_name', 'score', 'correct_answers', 'time_completed', 'answers', 'rank', 'joined_at', 'finished_at')
        read_only_fields = ('id', 'joined_at', 'rank')


class UserProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    xp_progress_percentage = serializers.SerializerMethodField()
    xp_for_next_level = serializers.SerializerMethodField()
    current_level_xp = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = ('id', 'user_name', 'avatar', 'avatar_url', 'display_name', 'bio', 'total_xp', 'level', 'xp_for_next_level', 'current_level_xp', 'xp_progress_percentage', 'joined_at', 'last_active')
        read_only_fields = ('id', 'joined_at', 'last_active', 'total_xp', 'level')
    
    def get_avatar_url(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None
    
    def get_xp_progress_percentage(self, obj):
        return obj.xp_progress_percentage
    
    def get_xp_for_next_level(self, obj):
        return obj.xp_for_next_level
    
    def get_current_level_xp(self, obj):
        return obj.current_level_xp


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ('id', 'name', 'description', 'icon', 'achievement_type', 'xp_reward', 'requirement', 'rarity')


class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)
    
    class Meta:
        model = UserAchievement
        fields = ('id', 'achievement', 'unlocked_at')
        read_only_fields = ('id', 'unlocked_at')
