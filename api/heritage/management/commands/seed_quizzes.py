from django.core.management.base import BaseCommand
from heritage.models import Site, Quiz
import random


class Command(BaseCommand):
    help = 'Seed quiz questions for sites'

    def handle(self, *args, **options):
        # Lấy tất cả sites
        sites = Site.objects.all()
        
        if not sites.exists():
            self.stderr.write(self.style.ERROR('No sites found. Run seed_demo first.'))
            return
        
        # Tạo quiz cho từng site
        quiz_templates = [
            {
                'question_template': 'Di tích {name} được xây dựng vào thế kỷ nào?',
                'options': ['Thế kỷ 11', 'Thế kỷ 15', 'Thế kỷ 19', 'Thế kỷ 20'],
                'correct_index': 1,
            },
            {
                'question_template': '{name} thuộc loại hình di sản nào?',
                'options': ['Di sản văn hóa', 'Di sản thiên nhiên', 'Di sản hỗn hợp', 'Di sản phi vật thể'],
                'correct_index': 0,
            },
            {
                'question_template': '{name} nằm ở tỉnh/thành phố nào?',
                'options': ['Đà Nẵng', 'Quảng Nam', 'Thừa Thiên Huế', 'Quảng Trị'],
                'correct_index': 0,
            },
            {
                'question_template': 'Đặc điểm nổi bật của {name} là gì?',
                'options': ['Kiến trúc độc đáo', 'Lịch sử lâu đời', 'Cảnh quan đẹp', 'Tất cả đều đúng'],
                'correct_index': 3,
            },
            {
                'question_template': '{name} có ý nghĩa gì với người dân địa phương?',
                'options': ['Tâm linh tín ngưỡng', 'Du lịch giải trí', 'Giáo dục lịch sử', 'Tất cả đều đúng'],
                'correct_index': 3,
            },
        ]
        
        created_count = 0
        
        for site in sites[:10]:  # Tạo cho 10 sites đầu tiên
            # Tạo 3-5 quiz cho mỗi site
            num_quizzes = random.randint(3, 5)
            templates_to_use = random.sample(quiz_templates, min(num_quizzes, len(quiz_templates)))
            
            for template in templates_to_use:
                question_text = template['question_template'].format(name=site.name)
                # Map index to letter (0->A, 1->B, 2->C, 3->D)
                correct_letter = chr(65 + template['correct_index'])  # 65 is ASCII for 'A'
                
                quiz, created = Quiz.objects.get_or_create(
                    site=site,
                    question=question_text,
                    defaults={
                        'option_a': template['options'][0],
                        'option_b': template['options'][1],
                        'option_c': template['options'][2],
                        'option_d': template['options'][3],
                        'correct_answer': correct_letter,
                        'xp_reward': random.choice([10, 15, 20, 25])
                    }
                )
                
                if created:
                    created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Created {created_count} quiz questions'))
