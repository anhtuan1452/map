import json

with open('data_export_fixed.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    if item.get('model') == 'heritage.quizbattleparticipant':
        if 'total_answered' in item['fields']:
            del item['fields']['total_answered']
            print(f"Đã xóa total_answered từ pk={item['pk']}")

with open('data_export_cleaned.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Hoàn tất! File mới: data_export_cleaned.json')
