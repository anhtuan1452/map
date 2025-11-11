from django.core.management.base import BaseCommand
from heritage.models import Site
import json
import os


class Command(BaseCommand):
    help = 'Load sites from initial_sites.geojson fixture'

    def handle(self, *args, **options):
        # Path to geojson file
        fixture_path = os.path.join('fixtures', 'initial_sites.geojson')
        
        if not os.path.exists(fixture_path):
            self.stdout.write(self.style.ERROR(f'File not found: {fixture_path}'))
            return
        
        # Load geojson
        with open(fixture_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Delete all existing sites
        deleted_count = Site.objects.all().count()
        Site.objects.all().delete()
        self.stdout.write(self.style.WARNING(f'Deleted {deleted_count} existing sites'))
        
        # Import sites
        imported = 0
        for feature in data['features']:
            props = feature['properties']
            
            Site.objects.create(
                site_id=props['id'],
                name=props['name'],
                geojson=feature,
                image_urls=props.get('images', []),
                conservation_status=props.get('conservation_status', 'good'),
                status_description='',
                conduct={
                    'dos': props.get('dos', []),
                    'donts': props.get('donts', []),
                    'lawExcerpt': props.get('legal_excerpt', ''),
                    'lawLink': ''
                }
            )
            
            status = props.get('conservation_status', 'good')
            self.stdout.write(
                self.style.SUCCESS(f'✓ {props["name"]} - Status: {status}')
            )
            imported += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Successfully imported {imported} sites')
        )
