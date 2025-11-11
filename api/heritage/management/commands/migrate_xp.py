from django.core.management.base import BaseCommand
from django.db.models import Sum
from heritage.models import QuizAttempt, UserProfile

class Command(BaseCommand):
    help = 'Migrate XP data from QuizAttempt to UserProfile'

    def handle(self, *args, **options):
        self.stdout.write('Starting XP migration...')

        # Get all users who have quiz attempts
        users_with_attempts = QuizAttempt.objects.values('user_name').distinct()

        migrated_count = 0
        total_xp_migrated = 0

        for user_data in users_with_attempts:
            user_name = user_data['user_name']

            # Calculate total XP from attempts
            user_xp = QuizAttempt.objects.filter(user_name=user_name).aggregate(
                total=Sum('xp_earned')
            )['total'] or 0

            if user_xp > 0:
                # Get or create user profile
                profile, created = UserProfile.objects.get_or_create(
                    user_name=user_name,
                    defaults={
                        'display_name': user_name,
                        'total_xp': 0,
                        'level': 1
                    }
                )

                if created:
                    self.stdout.write(f'Created profile for {user_name}')
                else:
                    self.stdout.write(f'Updating profile for {user_name}')

                # Set total XP and calculate level
                profile.total_xp = user_xp
                profile.save()  # This will trigger level calculation

                migrated_count += 1
                total_xp_migrated += user_xp

                self.stdout.write(
                    f'  {user_name}: {user_xp} XP -> Level {profile.level}'
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Migration completed! Migrated {migrated_count} users, '
                f'{total_xp_migrated} total XP'
            )
        )