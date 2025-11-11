from django.core.management.base import BaseCommand
from heritage.models import Quiz, QuizAttempt, QuizBattle, QuizBattleParticipant, Site
from django.utils import timezone
from datetime import timedelta
import random


class Command(BaseCommand):
    help = 'Create demo battle with seed data'

    def handle(self, *args, **kwargs):
        # Step 1: Create some quiz attempts if not enough users
        usernames = ['alice', 'bob', 'charlie', 'david', 'emma', 'frank']
        
        self.stdout.write('Checking existing quiz attempts...')
        existing_attempts = QuizAttempt.objects.count()
        self.stdout.write(f'Found {existing_attempts} existing attempts')
        
        if existing_attempts < 10:
            self.stdout.write('Creating demo quiz attempts...')
            quizzes = list(Quiz.objects.all())
            
            if len(quizzes) == 0:
                self.stdout.write(self.style.ERROR('No quizzes found! Please create quizzes first.'))
                return
            
            for username in usernames:
                # Each user answers 2-4 random quizzes
                num_quizzes = random.randint(2, 4)
                selected_quizzes = random.sample(quizzes, min(num_quizzes, len(quizzes)))
                
                for quiz in selected_quizzes:
                    # Skip if already attempted
                    if QuizAttempt.objects.filter(quiz=quiz, user_name=username).exists():
                        continue
                    
                    # Random correct/wrong answer
                    is_correct = random.choice([True, True, True, False])  # 75% correct
                    correct_answer = quiz.correct_answer
                    user_answer = correct_answer if is_correct else random.choice(['A', 'B', 'C', 'D'])
                    
                    QuizAttempt.objects.create(
                        quiz=quiz,
                        user_name=username,
                        user_answer=user_answer,
                        is_correct=is_correct,
                        xp_earned=quiz.xp_reward if is_correct else 0,
                        time_taken=random.randint(5, 30),
                        started_at=timezone.now() - timedelta(seconds=random.randint(5, 30)),
                    )
                    
                    result = "correct" if is_correct else "wrong"
                    self.stdout.write(f'  ✓ {username} answered quiz {quiz.id} ({result})')
        
        # Step 2: Get top 4 users by XP
        from django.db.models import Sum
        
        leaderboard = QuizAttempt.objects.values('user_name').annotate(
            total_xp=Sum('xp_earned')
        ).filter(total_xp__gt=0).order_by('-total_xp')
        
        if leaderboard.count() < 4:
            self.stdout.write(self.style.ERROR(f'Need at least 4 users with XP. Found {leaderboard.count()}'))
            return
        
        top_users = [u['user_name'] for u in leaderboard[:4]]
        self.stdout.write(self.style.SUCCESS(f'Top 4 users: {top_users}'))
        
        # Step 3: Random 6 questions
        all_quizzes = list(Quiz.objects.values_list('id', flat=True))
        if len(all_quizzes) < 6:
            self.stdout.write(self.style.ERROR(f'Need at least 6 quizzes. Found {len(all_quizzes)}'))
            return
        
        selected_questions = random.sample(all_quizzes, 6)
        self.stdout.write(f'Selected questions: {selected_questions}')
        
        # Step 4: Create battle
        scheduled_time = timezone.now() + timedelta(minutes=1)  # Start in 1 minute
        
        battle = QuizBattle.objects.create(
            scheduled_start_time=scheduled_time,
            duration_minutes=10,
            status='pending',
            questions=selected_questions,
            participants=top_users
        )
        
        # Create participants
        for username in top_users:
            QuizBattleParticipant.objects.create(
                battle=battle,
                user_name=username
            )
        
        self.stdout.write(self.style.SUCCESS(f'✓ Created battle #{battle.id}'))
        self.stdout.write(f'  Participants: {top_users}')
        self.stdout.write(f'  Questions: {len(selected_questions)}')
        self.stdout.write(f'  Start time: {scheduled_time}')
        self.stdout.write(f'  Duration: {battle.duration_minutes} minutes')
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('To start the battle, run:'))
        self.stdout.write(f'  python manage.py start_battle {battle.id}')
