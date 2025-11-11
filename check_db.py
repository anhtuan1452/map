import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
heritage_tables = [table[0] for table in tables if 'heritage' in table[0]]
print("Heritage tables:", heritage_tables)

# Try to import the models
try:
    from heritage.models import Achievement, UserProfile, UserAchievement
    print("Models imported successfully")
    print(f"Achievement count: {Achievement.objects.count()}")
    print(f"UserProfile count: {UserProfile.objects.count()}")
except ImportError as e:
    print(f"Import error: {e}")