from rest_framework import serializers
from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    site_name = serializers.CharField(source='site.name', read_only=True)
    can_delete = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ('id', 'site', 'site_name', 'user_name', 'content', 'images', 
                  'created_at', 'updated_at', 'is_reported', 'report_count', 'can_delete')
        read_only_fields = ('id', 'created_at', 'updated_at', 'is_reported', 'report_count')
    
    def get_can_delete(self, obj):
        from .auth_views import get_user_role
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            return False
        user = request.user
        # User can delete their own comments, teacher/super_admin can delete any
        if user.is_authenticated:
            user_role = get_user_role(user)
            if user_role in ['teacher', 'super_admin']:
                return True
            # Check if this comment belongs to current user
            if hasattr(user, 'username') and user.username == obj.user_name:
                return True
        return False


class CommentCreateSerializer(serializers.ModelSerializer):
    site_id = serializers.CharField(write_only=True)
    
    class Meta:
        model = Comment
        fields = ('site_id', 'user_name', 'content', 'images')
    
    def create(self, validated_data):
        from .models import Site
        site_id = validated_data.pop('site_id')
        try:
            site = Site.objects.get(site_id=site_id)
            validated_data['site'] = site
            return super().create(validated_data)
        except Site.DoesNotExist:
            raise serializers.ValidationError({'site_id': f'Không tìm thấy địa điểm với ID: {site_id}'})
