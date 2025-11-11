from django.core.management.base import BaseCommand
from heritage.models import QuizBattle


class Command(BaseCommand):
    help = 'Start a battle (set status to in_progress)'

    def add_arguments(self, parser):
        parser.add_argument('battle_id', type=int, help='Battle ID to start')

    def handle(self, *args, **kwargs):
        battle_id = kwargs['battle_id']
        
        try:
            battle = QuizBattle.objects.get(id=battle_id)
        except QuizBattle.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Battle #{battle_id} not found'))
            return
        
        if battle.status != 'pending':
            self.stdout.write(self.style.WARNING(f'Battle #{battle_id} is already {battle.status}'))
            return
        
        battle.status = 'in_progress'
        battle.save()
        
        self.stdout.write(self.style.SUCCESS(f'✓ Battle #{battle_id} started!'))
        self.stdout.write(f'  Participants: {battle.participants}')
        self.stdout.write(f'  Duration: {battle.duration_minutes} minutes')
        self.stdout.write('')
        self.stdout.write('Users can now join and answer questions!')
