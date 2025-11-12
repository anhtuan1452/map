#!/usr/bin/env python
"""
Dump data with proper UTF-8 encoding
"""
import os
import sys
import django
import json

# Setup Django
sys.path.insert(0, '/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from django.core.management import call_command
from io import StringIO

# Capture dumpdata output
output = StringIO()
call_command('dumpdata', stdout=output, indent=2)

# Write with UTF-8 encoding (no BOM)
with open('/app/full_data_backup_utf8.json', 'w', encoding='utf-8') as f:
    f.write(output.getvalue())

print("Data dumped to full_data_backup_utf8.json")