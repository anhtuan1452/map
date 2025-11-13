import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from heritage.models import Site

# Sites that have quiz data (from import_quiz_full.py)
sites_with_quizzes = {
    "diadaovinhmoc",
    "quangbinhquan", 
    "luythay",
    "tuongdaimesuot",
    "benphalongdai"
}

# Load geojson
with open('fixtures/initial_sites.geojson', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Delete all existing sites
deleted_count = Site.objects.all().count()
Site.objects.all().delete()
print(f'Deleted {deleted_count} existing sites')

# Import sites
imported = 0
skipped = 0
for feature in data['features']:
    props = feature['properties']
    site_id = props['id']
    
    # Only import sites that have quiz data
    if site_id not in sites_with_quizzes:
        print(f'⊘ Skipped {props["name"]} (no quiz data)')
        skipped += 1
        continue
    
    Site.objects.create(
        site_id=props['id'],
        name=props['name'],
        geojson=feature,
        image_urls=props.get('image_urls', []),
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

print(f'\n✓ Successfully imported {imported} sites with quiz data')
print(f'⊘ Skipped {skipped} sites without quiz data')
