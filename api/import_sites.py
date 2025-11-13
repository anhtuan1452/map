import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from heritage.models import Site

# Load geojson
with open('fixtures/initial_sites.geojson', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Delete all existing sites
deleted_count = Site.objects.all().count()
Site.objects.all().delete()
print(f'Deleted {deleted_count} existing sites')

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
    print(f'✓ {props["name"]} - Status: {status}')
    imported += 1

print(f'\n✓ Successfully imported {imported} sites')
