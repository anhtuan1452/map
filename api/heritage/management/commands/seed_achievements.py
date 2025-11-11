from django.core.management.base import BaseCommand
from heritage.models import Achievement


class Command(BaseCommand):
    help = 'Seed default achievements'

    def handle(self, *args, **options):
        achievements = [
            {
                'name': 'First Quiz',
                'description': 'Hoàn thành câu hỏi đầu tiên',
                'icon': 'Play',
                'achievement_type': 'first_quiz',
                'xp_reward': 10,
                'requirement': {'total_quizzes': 1},
                'rarity': 'common'
            },
            {
                'name': 'Quiz Novice',
                'description': 'Hoàn thành 10 câu hỏi',
                'icon': 'BookOpen',
                'achievement_type': 'quiz_master',
                'xp_reward': 50,
                'requirement': {'total_quizzes': 10},
                'rarity': 'common'
            },
            {
                'name': 'Quiz Expert',
                'description': 'Hoàn thành 50 câu hỏi',
                'icon': 'Brain',
                'achievement_type': 'quiz_master',
                'xp_reward': 150,
                'requirement': {'total_quizzes': 50},
                'rarity': 'rare'
            },
            {
                'name': 'Quiz Master',
                'description': 'Hoàn thành 100 câu hỏi',
                'icon': 'Trophy',
                'achievement_type': 'quiz_master',
                'xp_reward': 300,
                'requirement': {'total_quizzes': 100},
                'rarity': 'epic'
            },
            {
                'name': 'Speed Demon',
                'description': 'Trả lời đúng trong vòng 5 giây',
                'icon': 'Zap',
                'achievement_type': 'speed_demon',
                'xp_reward': 25,
                'requirement': {'fastest_time': 5},
                'rarity': 'rare'
            },
            {
                'name': 'Perfect Score',
                'description': 'Đạt điểm hoàn hảo trong một trận đấu',
                'icon': 'Star',
                'achievement_type': 'perfect_score',
                'xp_reward': 100,
                'requirement': {'perfect_battle': True},
                'rarity': 'epic'
            },
            {
                'name': 'Battle Winner',
                'description': 'Chiến thắng trận đấu đầu tiên',
                'icon': 'Crown',
                'achievement_type': 'battle_winner',
                'xp_reward': 75,
                'requirement': {'battle_wins': 1},
                'rarity': 'rare'
            },
            {
                'name': 'Explorer',
                'description': 'Khám phá 5 địa điểm khác nhau',
                'icon': 'MapPin',
                'achievement_type': 'explorer',
                'xp_reward': 40,
                'requirement': {'unique_sites': 5},
                'rarity': 'common'
            },
            {
                'name': 'Early Bird',
                'description': 'Hoàn thành câu hỏi trước 8 giờ sáng',
                'icon': 'Sun',
                'achievement_type': 'early_bird',
                'xp_reward': 30,
                'requirement': {'early_morning_quiz': True},
                'rarity': 'rare'
            },
            {
                'name': 'Level 5',
                'description': 'Đạt level 5',
                'icon': 'TrendingUp',
                'achievement_type': 'quiz_master',
                'xp_reward': 100,
                'requirement': {'level': 5},
                'rarity': 'rare'
            },
            {
                'name': 'Level 10',
                'description': 'Đạt level 10',
                'icon': 'Award',
                'achievement_type': 'quiz_master',
                'xp_reward': 200,
                'requirement': {'level': 10},
                'rarity': 'epic'
            },
            {
                'name': 'Legend',
                'description': 'Đạt level 25',
                'icon': 'Gem',
                'achievement_type': 'quiz_master',
                'xp_reward': 500,
                'requirement': {'level': 25},
                'rarity': 'legendary'
            }
        ]

        for achievement_data in achievements:
            achievement, created = Achievement.objects.get_or_create(
                name=achievement_data['name'],
                defaults=achievement_data
            )
            if created:
                self.stdout.write(f'Created achievement: {achievement.name}')
            else:
                self.stdout.write(f'Achievement already exists: {achievement.name}')

        self.stdout.write(self.style.SUCCESS('Successfully seeded achievements'))