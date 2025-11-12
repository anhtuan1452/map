import json
import ftfy

# Đọc file bị lỗi
with open('data_export_fixed.json', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix encoding
fixed_content = ftfy.fix_text(content)

# Lưu file mới
with open('data_export_tiengviet.json', 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print('Đã fix encoding thành công!')
print('File mới: data_export_tiengviet.json')
