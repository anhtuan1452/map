import json
import html

# Read the export data
with open('data_export_20251113_050007.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Extract sites
sites = data['sites']

# Create features list
features = []

def fix_encoding(obj):
    if isinstance(obj, str):
        # Try to decode as latin-1 then utf-8
        try:
            return obj.encode('latin-1').decode('utf-8')
        except:
            return obj
    elif isinstance(obj, list):
        return [fix_encoding(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: fix_encoding(value) for key, value in obj.items()}
    else:
        return obj

for site in sites:
    geojson = site['geojson']

    # Fix encoding issues
    geojson = fix_encoding(geojson)

    # Use the conduct field for dos/donts if available
    if 'conduct' in geojson['properties']:
        conduct = geojson['properties']['conduct']
        if 'dos' in conduct:
            geojson['properties']['dos'] = conduct['dos']
        if 'donts' in conduct:
            geojson['properties']['donts'] = conduct['donts']
        if 'lawExcerpt' in conduct:
            geojson['properties']['legal_excerpt'] = conduct['lawExcerpt']

    # Fix quiz questions if they exist
    if 'quiz' in geojson['properties']:
        for quiz_item in geojson['properties']['quiz']:
            if 'question' in quiz_item:
                # Try to fix common corrupted Vietnamese words
                question = quiz_item['question']
                question = question.replace('ThĂ nh', 'Thành').replace('cá»•', 'cổ').replace('Quáº£ng', 'Quảng').replace('Trá»‹', 'Trị')
                question = question.replace('ná»•i', 'nổi').replace('tiáº¿ng', 'tiếng').replace('vá»›i', 'với').replace('tráº­n', 'trận')
                question = question.replace('chiáº¿n', 'chiến').replace('kéo', 'kéo').replace('dĂ i', 'dài').replace('Ä‘Ăªm', 'đêm')
                question = question.replace('kéo', 'kéo').replace('dài', 'dài').replace('đêm', 'đêm')
                question = question.replace('bao', 'bao').replace('nhiĂªu', 'nhiều').replace('ngĂ y', 'ngày')
                quiz_item['question'] = question
            if 'explanation' in quiz_item:
                explanation = quiz_item['explanation']
                explanation = explanation.replace('ThĂ nh', 'Thành').replace('cá»•', 'cổ').replace('Quáº£ng', 'Quảng').replace('Trá»‹', 'Trị')
                explanation = explanation.replace('kéo', 'kéo').replace('dĂ i', 'dài').replace('Ä‘Ăªm', 'đêm')
                explanation = explanation.replace('Ă¡c', 'ác').replace('liá»‡t', 'liệt').replace('nháº¥t', 'nhất')
                explanation = explanation.replace('trong', 'trong').replace('chiáº¿n', 'chiến').replace('tranh', 'tranh')
                explanation = explanation.replace('Viá»‡t', 'Việt').replace('Nam', 'Nam').replace('tá»«', 'từ')
                explanation = explanation.replace('thĂ¡ng', 'tháng').replace('lá', 'là').replace('má»™t', 'một')
                quiz_item['explanation'] = explanation
            if 'choices' in quiz_item:
                choices = quiz_item['choices']
                fixed_choices = []
                for choice in choices:
                    choice = choice.replace('ngĂ y', 'ngày').replace('Ä‘Ăªm', 'đêm')
                    fixed_choices.append(choice)
                quiz_item['choices'] = fixed_choices

    features.append(geojson)

# Create the FeatureCollection
geojson_data = {
    "type": "FeatureCollection",
    "features": features
}

# Write to initial_sites.geojson
with open('fixtures/initial_sites.geojson', 'w', encoding='utf-8') as f:
    json.dump(geojson_data, f, ensure_ascii=False, indent=2)

print("Updated initial_sites.geojson with properly decoded site data from export")