# myapp/management/commands/loaddata_fix.py
from django.core.management.commands.loaddata import Command as LoadDataCommand
import json

class Command(LoadDataCommand):
    def load_label(self, fixture_label):
        # Đọc file với utf-8-sig để tự động loại bỏ BOM
        with open(fixture_label, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
        
        # Ghi lại file tạm không có BOM
        temp_file = fixture_label.replace('.json', '_temp.json')
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        # Load từ file tạm
        super().load_label(temp_file)