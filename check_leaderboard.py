import os
import django
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
os.environ['USE_POSTGRES'] = 'False'
django.setup()

from heritage.models import QuizAttempt
from django.db.models import Count, Sum, Q

# Get leaderboard data
attempts = QuizAttempt.objects.all()
leaderboard = attempts.values('user_name').annotate(
    total_questions=Count('id'),
    correct_answers=Count('id', filter=Q(is_correct=True)),
    total_time=Sum('time_taken'),
    total_xp=Sum('xp_earned')
).order_by('-total_xp', '-correct_answers', 'total_time')

print("Leaderboard (top 10):")
for i, entry in enumerate(leaderboard[:10], 1):
    print(f"{i}. {entry['user_name']}: XP={entry['total_xp']}, Correct={entry['correct_answers']}, Time={entry['total_time']}")

# Check specific user
student02_data = leaderboard.filter(user_name='học sinh02').first()
if student02_data:
    print(f"\nStudent02 details: {student02_data}")
else:
    print("\nNo data found for 'học sinh02'")