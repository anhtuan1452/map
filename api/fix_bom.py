# fix_bom.py
import json

# Đọc file với utf-8-sig (tự động loại bỏ BOM)
with open('api/data_export_20251110_223234.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

# Ghi lại file với utf-8 thuần (không BOM)
with open('data_export_fixed.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Đã fix BOM thành công! File mới: data_export_fixed.json")