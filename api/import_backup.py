#!/usr/bin/env python
"""
Script to import data from JSON backup directly
"""
import os
import sys
import django
import json

# Setup Django
sys.path.insert(0, '/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from heritage.models import Site, Feedback, Quiz, QuizAttempt, UserProfile, UserRole, Comment

def import_data():
    print("Loading backup data...")
    with open('/app/full_data_backup_clean2.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Found {len(data)} objects to import")

    created_counts = {
        'user': 0,
        'site': 0,
        'feedback': 0,
        'quiz': 0,
        'quizattempt': 0,
        'userprofile': 0,
        'userrole': 0,
        'comment': 0
    }

    for item in data:
        model = item['model']
        fields = item['fields']

        try:
            if model == 'auth.user':
                from django.contrib.auth.models import User
                if not User.objects.filter(username=fields['username']).exists():
                    User.objects.create_user(
                        username=fields['username'],
                        email=fields.get('email', ''),
                        password=fields['password'],
                        first_name=fields.get('first_name', ''),
                        last_name=fields.get('last_name', ''),
                        is_staff=fields.get('is_staff', False),
                        is_active=fields.get('is_active', True)
                    )
                    created_counts['user'] += 1

            elif model == 'heritage.site':
                if not Site.objects.filter(site_id=fields['site_id']).exists():
                    Site.objects.create(
                        site_id=fields['site_id'],
                        name=fields['name'],
                        geojson=fields['geojson'],
                        image_urls=fields['image_urls'],
                        conservation_status=fields['conservation_status'],
                        status_description=fields['status_description'],
                        created=fields['created'],
                        updated=fields['updated']
                    )
                    created_counts['site'] += 1

            elif model == 'heritage.feedback':
                if not Feedback.objects.filter(id=item['pk']).exists():
                    Feedback.objects.create(
                        id=item['pk'],
                        site_id=fields['site_id'],
                        name=fields['name'],
                        email=fields['email'],
                        category=fields['category'],
                        message=fields['message'],
                        image=fields.get('image'),
                        created=fields['created']
                    )
                    created_counts['feedback'] += 1

            elif model == 'heritage.quiz':
                if not Quiz.objects.filter(id=item['pk']).exists():
                    Quiz.objects.create(
                        id=item['pk'],
                        site_id=fields['site_id'],
                        question=fields['question'],
                        option_a=fields['option_a'],
                        option_b=fields['option_b'],
                        option_c=fields['option_c'],
                        option_d=fields['option_d'],
                        correct_answer=fields['correct_answer'],
                        xp_reward=fields['xp_reward'],
                        created=fields['created']
                    )
                    created_counts['quiz'] += 1

            elif model == 'heritage.quizattempt':
                if not QuizAttempt.objects.filter(id=item['pk']).exists():
                    QuizAttempt.objects.create(
                        id=item['pk'],
                        quiz_id=fields['quiz_id'],
                        user_name=fields['user_name'],
                        user_answer=fields['user_answer'],
                        is_correct=fields['is_correct'],
                        xp_earned=fields['xp_earned'],
                        started_at=fields['started_at'],
                        completed_at=fields['completed_at']
                    )
                    created_counts['quizattempt'] += 1

            elif model == 'heritage.userprofile':
                if not UserProfile.objects.filter(id=item['pk']).exists():
                    UserProfile.objects.create(
                        id=item['pk'],
                        user_id=fields['user_id'],
                        avatar=fields.get('avatar', ''),
                        total_xp=fields['total_xp'],
                        level=fields['level']
                    )
                    created_counts['userprofile'] += 1

            elif model == 'heritage.userrole':
                if not UserRole.objects.filter(id=item['pk']).exists():
                    UserRole.objects.create(
                        id=item['pk'],
                        user_id=fields['user_id'],
                        role=fields['role']
                    )
                    created_counts['userrole'] += 1

            elif model == 'heritage.comment':
                if not Comment.objects.filter(id=item['pk']).exists():
                    Comment.objects.create(
                        id=item['pk'],
                        site_id=fields['site_id'],
                        user_name=fields['user_name'],
                        content=fields['content'],
                        images=fields['images'],
                        created_at=fields['created_at']
                    )
                    created_counts['comment'] += 1

        except Exception as e:
            print(f"Error importing {model} {item['pk']}: {e}")
            continue

    print("Import completed!")
    for model, count in created_counts.items():
        print(f"  {model}: {count} created")

if __name__ == '__main__':
    import_data()