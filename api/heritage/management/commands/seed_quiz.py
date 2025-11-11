from django.core.management.base import BaseCommand
from heritage.models import Site, Quiz

class Command(BaseCommand):
    help = 'Seed demo quiz data'

    def handle(self, *args, **options):
        # Lấy một số site để tạo quiz
        sites = Site.objects.all()[:5]  # Lấy 5 sites đầu tiên
        
        if not sites.exists():
            self.stdout.write(self.style.ERROR('Không có site nào trong database!'))
            return

        quizzes_created = 0
        
        for site in sites:
            # Tạo 2-3 quiz cho mỗi site
            quiz_data = [
                {
                    'question': f'{site.name} được xây dựng vào thời gian nào?',
                    'option_a': 'Thế kỷ 15',
                    'option_b': 'Thế kỷ 17',
                    'option_c': 'Thế kỷ 19',
                    'option_d': 'Thế kỷ 20',
                    'correct_answer': 'B'
                },
                {
                    'question': f'{site.name} nằm ở tỉnh/thành phố nào?',
                    'option_a': 'Hà Nội',
                    'option_b': 'Huế',
                    'option_c': 'Quảng Trị',
                    'option_d': 'Đà Nẵng',
                    'correct_answer': 'C'
                },
                {
                    'question': f'Giá trị lịch sử quan trọng nhất của {site.name} là gì?',
                    'option_a': 'Di tích kiến trúc',
                    'option_b': 'Chiến trường lịch sử',
                    'option_c': 'Văn hóa dân gian',
                    'option_d': 'Tôn giáo tín ngưỡng',
                    'correct_answer': 'B'
                }
            ]
            
            for data in quiz_data:
                quiz, created = Quiz.objects.get_or_create(
                    site=site,
                    question=data['question'],
                    defaults={
                        'option_a': data['option_a'],
                        'option_b': data['option_b'],
                        'option_c': data['option_c'],
                        'option_d': data['option_d'],
                        'correct_answer': data['correct_answer']
                    }
                )
                if created:
                    quizzes_created += 1
                    self.stdout.write(f'Tạo quiz: {quiz.question}')
        
        self.stdout.write(self.style.SUCCESS(f'✅ Đã tạo {quizzes_created} quiz mới!'))
