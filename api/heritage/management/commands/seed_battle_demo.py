from django.core.management.base import BaseCommand
from heritage.models import Site, Quiz, QuizAttempt, QuizBattle, QuizBattleParticipant
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import timedelta
import random


class Command(BaseCommand):
    help = 'Seed complete demo data for battle testing'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('=== SEEDING DEMO DATA FOR BATTLE ==='))
        
        # Step 1: Create sites if needed
        self.stdout.write('\n1. Creating demo sites...')
        sites_data = [
            {
                'site_id': 'nga_ba_dong_loc',
                'name': 'Ngã ba Đồng Lộc',
                'lat': 18.4833,
                'lng': 105.7167,
                'conservation_status': 'good',
            },
            {
                'site_id': 'thanh_co_quang_tri',
                'name': 'Thành cổ Quảng Trị',
                'lat': 16.8167,
                'lng': 107.1833,
                'conservation_status': 'watch',
            },
            {
                'site_id': 'cau_hien_luong',
                'name': 'Cầu Hiền Lương',
                'lat': 16.9333,
                'lng': 107.05,
                'conservation_status': 'good',
            },
        ]
        
        sites = []
        for site_data in sites_data:
            site, created = Site.objects.get_or_create(
                site_id=site_data['site_id'],
                defaults={
                    'name': site_data['name'],
                    'geojson': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [site_data['lng'], site_data['lat']]
                        },
                        'properties': {
                            'id': site_data['site_id'],
                            'name': site_data['name']
                        }
                    },
                    'conservation_status': site_data['conservation_status'],
                    'conduct': {
                        'dos': ['Giữ gìn vệ sinh', 'Tôn trọng di tích'],
                        'donts': ['Xả rác', 'Làm ồn'],
                        'lawExcerpt': 'Luật Di sản văn hóa 2001'
                    }
                }
            )
            sites.append(site)
            if created:
                self.stdout.write(f'  ✓ Created site: {site.name}')
            else:
                self.stdout.write(f'  - Site exists: {site.name}')
        
        # Step 2: Create quizzes (at least 6)
        self.stdout.write('\n2. Creating demo quizzes...')
        quizzes_data = [
            {
                'site': sites[0],
                'question': 'Ngã ba Đồng Lộc nằm ở tỉnh nào?',
                'option_a': 'Hà Tĩnh',
                'option_b': 'Quảng Bình',
                'option_c': 'Nghệ An',
                'option_d': 'Thanh Hóa',
                'correct_answer': 'A',
                'xp_reward': 10,
            },
            {
                'site': sites[0],
                'question': 'Ngã ba Đồng Lộc nổi tiếng về điều gì?',
                'option_a': 'Chiến thắng quân địch',
                'option_b': 'Nơi tập kết quân đội',
                'option_c': 'Đội thanh niên xung phong',
                'option_d': 'Căn cứ địa',
                'correct_answer': 'C',
                'xp_reward': 15,
            },
            {
                'site': sites[1],
                'question': 'Thành cổ Quảng Trị được xây dựng vào thời nào?',
                'option_a': 'Triều Nguyễn',
                'option_b': 'Triều Lê',
                'option_c': 'Thời Pháp thuộc',
                'option_d': 'Thời kháng chiến',
                'correct_answer': 'A',
                'xp_reward': 10,
            },
            {
                'site': sites[1],
                'question': 'Thành cổ Quảng Trị là biểu tượng của điều gì?',
                'option_a': 'Kiến trúc cổ',
                'option_b': 'Tinh thần kiên cường',
                'option_c': 'Văn hóa Champa',
                'option_d': 'Du lịch',
                'correct_answer': 'B',
                'xp_reward': 10,
            },
            {
                'site': sites[2],
                'question': 'Cầu Hiền Lương bắc qua sông nào?',
                'option_a': 'Sông Hương',
                'option_b': 'Sông Bến Hải',
                'option_c': 'Sông Thạch Hãn',
                'option_d': 'Sông Mã',
                'correct_answer': 'B',
                'xp_reward': 10,
            },
            {
                'site': sites[2],
                'question': 'Cầu Hiền Lương là biểu tượng của điều gì?',
                'option_a': 'Sự chia cắt đất nước',
                'option_b': 'Kiến trúc cầu đẹp',
                'option_c': 'Du lịch miền Trung',
                'option_d': 'Giao thông quan trọng',
                'correct_answer': 'A',
                'xp_reward': 15,
            },
            {
                'site': sites[0],
                'question': 'Ngày nào được gọi là "ngày đen tối nhất" tại Đồng Lộc?',
                'option_a': '24/7/1968',
                'option_b': '24/7/1972',
                'option_c': '30/4/1975',
                'option_d': '2/9/1945',
                'correct_answer': 'B',
                'xp_reward': 20,
            },
            {
                'site': sites[1],
                'question': 'Quảng Trị được mệnh danh là gì?',
                'option_a': 'Thành phố Anh hùng',
                'option_b': 'Đất thép',
                'option_c': 'Vùng đất lửa',
                'option_d': 'Thành cổ kiên cường',
                'correct_answer': 'B',
                'xp_reward': 10,
            },
        ]
        
        quizzes = []
        for quiz_data in quizzes_data:
            quiz, created = Quiz.objects.get_or_create(
                site=quiz_data['site'],
                question=quiz_data['question'],
                defaults={
                    'option_a': quiz_data['option_a'],
                    'option_b': quiz_data['option_b'],
                    'option_c': quiz_data['option_c'],
                    'option_d': quiz_data['option_d'],
                    'correct_answer': quiz_data['correct_answer'],
                    'xp_reward': quiz_data['xp_reward'],
                }
            )
            quizzes.append(quiz)
            if created:
                self.stdout.write(f'  ✓ Created quiz: {quiz.question[:50]}...')
            else:
                self.stdout.write(f'  - Quiz exists: {quiz.question[:50]}...')
        
        # Step 3: Create quiz attempts for demo users
        self.stdout.write('\n3. Creating demo user attempts...')
        usernames = ['alice_nguyen', 'bob_tran', 'charlie_le', 'diana_pham', 'ethan_vo', 'fiona_do']
        
        for username in usernames:
            # Each user answers 4-6 random quizzes
            num_quizzes = random.randint(4, 6)
            selected_quizzes = random.sample(quizzes, num_quizzes)
            
            for quiz in selected_quizzes:
                # Skip if already attempted
                if QuizAttempt.objects.filter(quiz=quiz, user_name=username).exists():
                    continue
                
                # 80% correct rate
                is_correct = random.random() < 0.8
                correct_answer = quiz.correct_answer
                user_answer = correct_answer if is_correct else random.choice([a for a in ['A', 'B', 'C', 'D'] if a != correct_answer])
                time_taken = random.randint(5, 25)
                
                QuizAttempt.objects.create(
                    quiz=quiz,
                    user_name=username,
                    user_answer=user_answer,
                    is_correct=is_correct,
                    xp_earned=quiz.xp_reward if is_correct else 0,
                    time_taken=time_taken,
                    started_at=timezone.now() - timedelta(seconds=time_taken),
                )
                
                result = "✓" if is_correct else "✗"
                self.stdout.write(f'  {result} {username}: Quiz #{quiz.id} ({time_taken}s)')
        
        # Step 4: Show leaderboard
        self.stdout.write('\n4. Current Leaderboard:')
        
        leaderboard = QuizAttempt.objects.values('user_name').annotate(
            total_xp=Sum('xp_earned'),
            quiz_count=Count('id'),
            correct_count=Count('id', filter=Q(is_correct=True))
        ).filter(total_xp__gt=0).order_by('-total_xp')
        
        for idx, entry in enumerate(leaderboard, 1):
            self.stdout.write(
                f'  {idx}. {entry["user_name"]}: {entry["total_xp"]} XP '
                f'({entry["correct_count"]}/{entry["quiz_count"]} correct)'
            )
        
        # Step 5: Create a battle
        self.stdout.write('\n5. Creating battle...')
        
        if leaderboard.count() < 4:
            self.stdout.write(self.style.ERROR(f'Need at least 4 users. Found {leaderboard.count()}'))
            return
        
        # Select top 4 users
        top_users = [u['user_name'] for u in leaderboard[:4]]
        
        # Random 6 questions
        selected_questions = [q.id for q in random.sample(quizzes, 6)]
        
        # Create battle starting in 1 minute
        scheduled_time = timezone.now() + timedelta(minutes=1)
        
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
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Created Battle #{battle.id}'))
        self.stdout.write(f'  Participants: {", ".join(top_users)}')
        self.stdout.write(f'  Questions: {len(selected_questions)} quizzes')
        self.stdout.write(f'  Scheduled: {scheduled_time.strftime("%H:%M:%S")}')
        self.stdout.write(f'  Duration: {battle.duration_minutes} minutes')
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('DEMO DATA CREATED SUCCESSFULLY!'))
        self.stdout.write('='*50)
        self.stdout.write('\nTo start the battle, run:')
        self.stdout.write(f'  python manage.py start_battle {battle.id}')
        self.stdout.write('\nOr use the API:')
        self.stdout.write(f'  POST /api/heritage/battles/{battle.id}/start_battle/')

