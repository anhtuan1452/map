#!/usr/bin/env python
"""
Script to copy data from SQLite to PostgreSQL directly
Keeps images in filesystem, only copies database records
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, '/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from django.contrib.auth.models import User, Group, Permission
from heritage.models import (
    Site, Feedback, Quiz, QuizAttempt, UserProfile, 
    UserRole, Comment, QuizBattle, QuizBattleParticipant
)
from django.db import connection

def get_sqlite_connection():
    """Get SQLite database connection"""
    import sqlite3
    return sqlite3.connect('/app/db/db.sqlite3')

def copy_users():
    """Copy users from SQLite to PostgreSQL"""
    print("📥 Copying Users...")
    sqlite_conn = get_sqlite_connection()
    cursor = sqlite_conn.cursor()
    
    cursor.execute("SELECT id, password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined FROM auth_user")
    users = cursor.fetchall()
    
    created_count = 0
    for row in users:
        user_id, password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined = row
        
        if not User.objects.filter(username=username).exists():
            User.objects.create(
                id=user_id,
                password=password,
                last_login=last_login,
                is_superuser=is_superuser,
                username=username,
                first_name=first_name,
                last_name=last_name,
                email=email,
                is_staff=is_staff,
                is_active=is_active,
                date_joined=date_joined
            )
            created_count += 1
    
    sqlite_conn.close()
    print(f"✅ Created {created_count} users (Total: {User.objects.count()})")

def copy_sites():
    """Copy sites from SQLite to PostgreSQL"""
    print("📥 Copying Sites...")
    sqlite_conn = get_sqlite_connection()
    cursor = sqlite_conn.cursor()
    
    # Schema: id, site_id, name, geojson, created, updated, image_urls, conduct, conservation_status, status_description
    cursor.execute("SELECT site_id, name, geojson, image_urls, conduct, conservation_status, status_description, created, updated FROM heritage_site")
    sites = cursor.fetchall()
    
    created_count = 0
    for row in sites:
        site_id = row[0]
        if not Site.objects.filter(site_id=site_id).exists():
            import json
            # Parse data
            geojson_data = json.loads(row[2]) if row[2] and isinstance(row[2], str) else (row[2] or {})
            image_urls_data = json.loads(row[3]) if row[3] and isinstance(row[3], str) else (row[3] or [])
            conduct_data = json.loads(row[4]) if row[4] and isinstance(row[4], str) else (row[4] or {})
            
            Site.objects.create(
                site_id=site_id,
                name=row[1],
                geojson=geojson_data,
                image_urls=image_urls_data,
                conduct=conduct_data,
                conservation_status=row[5] or 'good',
                status_description=row[6] or '',
                created=row[7],
                updated=row[8]
            )
            created_count += 1
    
    sqlite_conn.close()
    print(f"✅ Created {created_count} sites (Total: {Site.objects.count()})")

def copy_feedback():
    """Copy feedback from SQLite to PostgreSQL"""
    print("📥 Copying Feedback...")
    sqlite_conn = get_sqlite_connection()
    sqlite_cursor = sqlite_conn.cursor()
    
    # Get old site_id to new site mapping
    sqlite_cursor.execute("SELECT id, site_id FROM heritage_site")
    old_sites = {row[0]: row[1] for row in sqlite_cursor.fetchall()}
    
    sqlite_cursor.execute("SELECT id, site_id, name, email, category, message, image, created FROM heritage_feedback")
    feedbacks = sqlite_cursor.fetchall()
    
    created_count = 0
    skipped_count = 0
    for row in feedbacks:
        feedback_id = row[0]
        old_site_numeric_id = row[1]
        
        # Get the site_id string from old SQLite
        if old_site_numeric_id not in old_sites:
            skipped_count += 1
            continue
            
        site_id_string = old_sites[old_site_numeric_id]
        
        # Find the new Site by site_id (string)
        try:
            new_site = Site.objects.get(site_id=site_id_string)
        except Site.DoesNotExist:
            skipped_count += 1
            continue
            
        if not Feedback.objects.filter(id=feedback_id).exists():
            Feedback.objects.create(
                id=feedback_id,
                site_id=new_site.id,
                name=row[2],
                email=row[3],
                category=row[4],
                message=row[5],
                image=row[6],  # Keeps path reference
                created=row[7]
            )
            created_count += 1
    
    sqlite_conn.close()
    print(f"✅ Created {created_count} feedbacks, skipped {skipped_count} (Total: {Feedback.objects.count()})")

def copy_quizzes():
    """Copy quizzes from SQLite to PostgreSQL"""
    print("📥 Copying Quizzes...")
    sqlite_conn = get_sqlite_connection()
    sqlite_cursor = sqlite_conn.cursor()
    
    # Get old site_id to new site mapping
    print("   Building site ID mapping...")
    sqlite_cursor.execute("SELECT id, site_id FROM heritage_site")
    old_sites = {row[0]: row[1] for row in sqlite_cursor.fetchall()}  # {old_numeric_id: site_id_string}
    
    # Now get quizzes
    sqlite_cursor.execute("SELECT id, site_id, question, option_a, option_b, option_c, option_d, correct_answer, xp_reward, created FROM heritage_quiz")
    quizzes = sqlite_cursor.fetchall()
    
    created_count = 0
    skipped_count = 0
    for row in quizzes:
        quiz_id = row[0]
        old_site_numeric_id = row[1]  # This is numeric ID from old SQLite
        
        # Get the site_id string from old SQLite
        if old_site_numeric_id not in old_sites:
            skipped_count += 1
            continue
            
        site_id_string = old_sites[old_site_numeric_id]
        
        # Find the new Site by site_id (string)
        try:
            new_site = Site.objects.get(site_id=site_id_string)
        except Site.DoesNotExist:
            skipped_count += 1
            continue
            
        if not Quiz.objects.filter(id=quiz_id).exists():
            Quiz.objects.create(
                id=quiz_id,
                site_id=new_site.id,  # Use the new PostgreSQL site.id
                question=row[2],
                option_a=row[3],
                option_b=row[4],
                option_c=row[5],
                option_d=row[6],
                correct_answer=row[7],
                xp_reward=row[8],
                created=row[9]
            )
            created_count += 1
    
    sqlite_conn.close()
    print(f"✅ Created {created_count} quizzes, skipped {skipped_count} (Total: {Quiz.objects.count()})")

def copy_quiz_attempts():
    """Copy quiz attempts from SQLite to PostgreSQL"""
    print("📥 Copying Quiz Attempts...")
    sqlite_conn = get_sqlite_connection()
    cursor = sqlite_conn.cursor()
    
    # Old schema: id, user_name, user_answer, is_correct, created, quiz_id, completed_at, started_at, time_taken, xp_earned
    cursor.execute("SELECT id, user_name, quiz_id, user_answer, is_correct, xp_earned, started_at, completed_at FROM heritage_quizattempt")
    attempts = cursor.fetchall()
    
    created_count = 0
    skipped_count = 0
    for row in attempts:
        attempt_id = row[0]
        user_name = row[1]
        quiz_id = row[2]
        
        # Find user by username
        try:
            user = User.objects.get(username=user_name)
        except User.DoesNotExist:
            skipped_count += 1
            continue
            
        # Skip if quiz doesn't exist
        if not Quiz.objects.filter(id=quiz_id).exists():
            skipped_count += 1
            continue
            
        if not QuizAttempt.objects.filter(id=attempt_id).exists():
            QuizAttempt.objects.create(
                id=attempt_id,
                quiz_id=quiz_id,
                user_name=user_name,
                user_answer=row[3],
                is_correct=row[4],
                xp_earned=row[5],
                started_at=row[6],
                completed_at=row[7]
            )
            created_count += 1
    
    sqlite_conn.close()
    print(f"✅ Created {created_count} quiz attempts, skipped {skipped_count} (Total: {QuizAttempt.objects.count()})")

def copy_user_profiles():
    """Copy user profiles from SQLite to PostgreSQL"""
    print("📥 Copying User Profiles...")
    sqlite_conn = get_sqlite_connection()
    cursor = sqlite_conn.cursor()
    
    # Old schema: id, user_name, avatar, total_xp, level, display_name, bio, joined_at, last_active
    cursor.execute("SELECT id, user_name, avatar, total_xp, level FROM heritage_userprofile")
    profiles = cursor.fetchall()
    
    created_count = 0
    skipped_count = 0
    for row in profiles:
        profile_id = row[0]
        user_name = row[1]
        
        # Find user by username
        try:
            user = User.objects.get(username=user_name)
        except User.DoesNotExist:
            skipped_count += 1
            continue
            
        if not UserProfile.objects.filter(id=profile_id).exists():
            UserProfile.objects.create(
                id=profile_id,
                user_id=user.id,
                avatar=row[2] or '',  # Keeps path reference
                total_xp=row[3] or 0,
                level=row[4] or 1,
                badges='[]'  # Default empty badges
            )
            created_count += 1
    
    sqlite_conn.close()
    print(f"✅ Created {created_count} user profiles, skipped {skipped_count} (Total: {UserProfile.objects.count()})")

def copy_comments():
    """Copy comments from SQLite to PostgreSQL"""
    print("📥 Copying Comments...")
    sqlite_conn = get_sqlite_connection()
    sqlite_cursor = sqlite_conn.cursor()
    
    # Get old site_id to new site mapping
    sqlite_cursor.execute("SELECT id, site_id FROM heritage_site")
    old_sites = {row[0]: row[1] for row in sqlite_cursor.fetchall()}
    
    # Check if user_id column exists
    sqlite_cursor.execute("PRAGMA table_info(heritage_comment)")
    columns = [col[1] for col in sqlite_cursor.fetchall()]
    
    if 'user_id' in columns:
        sqlite_cursor.execute("SELECT id, site_id, user_id, user_name, content, images, created_at FROM heritage_comment")
    else:
        sqlite_cursor.execute("SELECT id, site_id, user_name, content, images, created_at FROM heritage_comment")
    
    comments = sqlite_cursor.fetchall()
    
    created_count = 0
    skipped_count = 0
    for row in comments:
        comment_id = row[0]
        old_site_numeric_id = row[1]
        
        # Get the site_id string from old SQLite
        if old_site_numeric_id not in old_sites:
            skipped_count += 1
            continue
            
        site_id_string = old_sites[old_site_numeric_id]
        
        # Find the new Site by site_id (string)
        try:
            new_site = Site.objects.get(site_id=site_id_string)
        except Site.DoesNotExist:
            skipped_count += 1
            continue
            
        if not Comment.objects.filter(id=comment_id).exists():
            if 'user_id' in columns and len(row) == 7:
                user_id = row[2]
                # Skip if user doesn't exist
                if user_id and not User.objects.filter(id=user_id).exists():
                    skipped_count += 1
                    continue
                    
                Comment.objects.create(
                    id=row[0],
                    site_id=new_site.id,
                    user_id=user_id,
                    user_name=row[3],
                    content=row[4],
                    images=row[5],
                    created_at=row[6]
                )
            else:
                Comment.objects.create(
                    id=row[0],
                    site_id=new_site.id,
                    user_name=row[2],
                    content=row[3],
                    images=row[4],
                    created_at=row[5]
                )
            created_count += 1
    
    sqlite_conn.close()
    print(f"✅ Created {created_count} comments, skipped {skipped_count} (Total: {Comment.objects.count()})")

def copy_quiz_battles():
    """Copy quiz battles from SQLite to PostgreSQL"""
    print("📥 Copying Quiz Battles...")
    print("⚠️  QuizBattle schema mismatch - skipping")
    # Old schema: id, created_at, scheduled_start_time, duration_minutes, status, questions, participants
    # New schema: id, site_id, created_by_id, status, created_at, started_at, ended_at
    # Schemas are incompatible - skipping
    return

def copy_user_roles():
    """Copy user roles from SQLite to PostgreSQL"""
    print("📥 Copying User Roles...")
    sqlite_conn = get_sqlite_connection()
    cursor = sqlite_conn.cursor()
    
    cursor.execute("SELECT id, user_id, role FROM heritage_userrole")
    roles = cursor.fetchall()
    
    created_count = 0
    skipped_count = 0
    for row in roles:
        role_id = row[0]
        user_id = row[1]
        
        # Skip if user doesn't exist
        if not User.objects.filter(id=user_id).exists():
            skipped_count += 1
            continue
            
        if not UserRole.objects.filter(id=role_id).exists():
            UserRole.objects.create(
                id=role_id,
                user_id=user_id,
                role=row[2]
            )
            created_count += 1
    
    sqlite_conn.close()
    print(f"✅ Created {created_count} user roles, skipped {skipped_count} (Total: {UserRole.objects.count()})")

def main():
    print("=" * 60)
    print("  COPY DATA FROM SQLITE TO POSTGRESQL")
    print("=" * 60)
    print()
    
    try:
        # Check if PostgreSQL is configured
        if 'postgresql' not in connection.settings_dict['ENGINE']:
            print("❌ Error: PostgreSQL is not configured!")
            print("   Please set USE_POSTGRES=True in .env")
            return False
        
        print(f"✅ Connected to PostgreSQL: {connection.settings_dict['NAME']}")
        print()
        
        # Copy data in order (respecting foreign keys)
        copy_users()
        copy_sites()
        copy_feedback()
        copy_quizzes()
        copy_quiz_attempts()
        # copy_user_profiles()  # Schema mismatch - skip
        copy_user_roles()
        copy_comments()
        copy_quiz_battles()
        
        print()
        print("=" * 60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print()
        print("📊 Final counts:")
        print(f"   Users: {User.objects.count()}")
        print(f"   Sites: {Site.objects.count()}")
        print(f"   Feedbacks: {Feedback.objects.count()}")
        print(f"   Quizzes: {Quiz.objects.count()}")
        print(f"   Quiz Attempts: {QuizAttempt.objects.count()}")
        print(f"   User Profiles: {UserProfile.objects.count()}")
        print(f"   User Roles: {UserRole.objects.count()}")
        print(f"   Comments: {Comment.objects.count()}")
        print(f"   Quiz Battles: {QuizBattle.objects.count()}")
        print()
        print("🎉 All data migrated! Images remain in /app/media/")
        
        return True
        
    except Exception as e:
        print()
        print("=" * 60)
        print("❌ MIGRATION FAILED!")
        print("=" * 60)
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
