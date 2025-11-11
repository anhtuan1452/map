#!/usr/bin/env python3
"""
Test script to verify XP calculation logic
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

# Mock Django settings
import django
from django.conf import settings
settings.configure(
    DEBUG=True,
    DATABASES={
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    },
    INSTALLED_APPS=[
        'django.contrib.contenttypes',
        'django.contrib.auth',
        'heritage',
    ],
    SECRET_KEY='test-key-only-for-testing'
)
django.setup()

from heritage.models import UserProfile

def test_xp_calculation():
    """Test XP calculation logic"""
    print("Testing XP calculation logic...")

    # Test xp_required_for_level
    print("\n1. Testing xp_required_for_level:")
    for level in range(1, 6):
        required = UserProfile.xp_required_for_level(level)
        print(f"  Level {level}: {required} XP required")

    # Test level calculation with different XP amounts
    test_cases = [0, 50, 100, 150, 300, 450, 600, 1000]

    print("\n2. Testing level calculation:")
    for total_xp in test_cases:
        # Calculate level manually
        level = 1
        while total_xp >= UserProfile.xp_required_for_level(level + 1):
            level += 1

        # Create a mock profile to test properties
        profile = UserProfile(total_xp=total_xp, level=level)

        xp_for_current = profile.xp_for_current_level
        xp_for_next = profile.xp_for_next_level
        current_level_xp = profile.current_level_xp
        progress_pct = profile.xp_progress_percentage

        print(f"  {total_xp} XP -> Level {level}")
        print(f"    xp_for_current_level: {xp_for_current}")
        print(f"    xp_for_next_level: {xp_for_next}")
        print(f"    current_level_xp: {current_level_xp}")
        print(f"    progress: {progress_pct:.1f}%")
        print()

if __name__ == '__main__':
    test_xp_calculation()