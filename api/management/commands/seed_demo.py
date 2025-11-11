import json
from django.core.management.base import BaseCommand
from heritage.models import Site


class Command(BaseCommand):
    help = 'Seed demo sites from fixtures/initial_sites.geojson'

    def handle(self, *args, **options):
        path = 'api/fixtures/initial_sites.geojson'
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f'Fixture file not found: {path}'))
            return

        count = 0
        for feature in data.get('features', []):
            props = feature.get('properties', {})
            site_id = props.get('id')
            name = props.get('name')
            # store full feature as geojson
            obj, created = Site.objects.update_or_create(
                site_id=site_id,
                defaults={'name': name, 'geojson': feature}
            )
            if created:
                count += 1
        self.stdout.write(self.style.SUCCESS(f'Seeded {count} sites'))
