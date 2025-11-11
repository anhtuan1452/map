from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, auth_views, comment_views, user_management_views

# Router cho ViewSets
router = DefaultRouter()
router.register(r'quizzes', views.QuizViewSet, basename='quiz')
router.register(r'quiz-attempts', views.QuizAttemptViewSet, basename='quiz-attempt')
router.register(r'feedbacks', views.FeedbackViewSet, basename='feedback')
router.register(r'battles', views.QuizBattleViewSet, basename='quiz-battle')
router.register(r'battle-participants', views.QuizBattleParticipantViewSet, basename='battle-participant')

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('sites/', views.sites_geojson, name='sites_geojson'),
    path('sites/<str:site_id>/', views.site_delete, name='site_delete'),
    path('sites/<str:site_id>/update/', views.site_update, name='site_update'),
    path('feedback/', views.feedback_create, name='feedback_create'),
    
    # User Profile endpoints
    path('user/profile/', views.user_profile, name='user_profile'),
    path('user/add-xp/', views.add_user_xp, name='add_user_xp'),
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    path('achievements/', views.achievements_list, name='achievements_list'),
    
    # Auth endpoints
    path('auth/csrf/', auth_views.get_csrf_token, name='get_csrf_token'),
    path('auth/login/', auth_views.login_api, name='login_api'),
    path('auth/logout/', auth_views.logout_api, name='logout_api'),
    path('auth/register/', auth_views.register_api, name='register_api'),
    path('auth/profile/', auth_views.user_profile, name='auth_user_profile'),
    path('auth/users/', auth_views.list_users, name='list_users'),
    path('auth/users/<int:user_id>/role/', auth_views.update_user_role, name='update_user_role'),
    path('auth/roles/', auth_views.get_role_choices, name='get_role_choices'),
    
    # Comment endpoints
    path('comments/', comment_views.comment_list_create, name='comment_list_create'),
    path('comments/<int:comment_id>/', comment_views.comment_delete, name='comment_delete'),
    path('comments/<int:comment_id>/report/', comment_views.comment_report, name='comment_report'),
    path('comments/reported/', comment_views.reported_comments_list, name='reported_comments_list'),
    path('comments/upload-image/', comment_views.upload_comment_image, name='upload_comment_image'),
    
    # User Management endpoints
    path('admin/users/create/', user_management_views.create_user, name='admin_create_user'),
    path('admin/users/<int:user_id>/role/', user_management_views.assign_role, name='admin_assign_role'),
    path('admin/users/list/', user_management_views.list_users, name='admin_list_users'),
    path('user/change-password/', user_management_views.change_password, name='change_password'),
    path('user/update-email/', user_management_views.update_email, name='update_email'),
    path('user/update-school-class/', user_management_views.update_school_class, name='update_school_class'),
    
    # System Settings endpoints
    path('settings/', views.get_system_settings, name='get_system_settings'),
    path('settings/feedback-email/', views.update_feedback_email, name='update_feedback_email'),
    
    # Quiz endpoints
    path('', include(router.urls)),
]
