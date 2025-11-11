# Generated manually for UserActivityLog model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('heritage', '0006_quizattempt_completed_at_quizattempt_started_at_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserActivityLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ip_address', models.GenericIPAddressField(help_text='IP address của người dùng')),
                ('user_agent', models.TextField(blank=True, help_text='User agent string từ browser')),
                ('path', models.CharField(help_text='URL path được truy cập', max_length=500)),
                ('method', models.CharField(help_text='HTTP method (GET, POST, etc.)', max_length=10)),
                ('status_code', models.IntegerField(help_text='HTTP status code trả về')),
                ('response_time', models.FloatField(help_text='Thời gian xử lý request (giây)')),
                ('user_name', models.CharField(blank=True, help_text='Tên người dùng nếu đã đăng nhập', max_length=200)),
                ('session_id', models.CharField(blank=True, help_text='Session ID', max_length=100)),
                ('referrer', models.URLField(blank=True, help_text='URL referrer')),
                ('country', models.CharField(blank=True, help_text='Quốc gia (từ IP geolocation)', max_length=100)),
                ('city', models.CharField(blank=True, help_text='Thành phố', max_length=100)),
                ('user_agent_parsed', models.JSONField(blank=True, default=dict, help_text='Thông tin phân tích user agent')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='useractivitylog',
            index=models.Index(fields=['ip_address', 'created_at'], name='heritage_us_ip_addres_8b8b7a_idx'),
        ),
        migrations.AddIndex(
            model_name='useractivitylog',
            index=models.Index(fields=['path', 'created_at'], name='heritage_us_path_4b8b7a_idx'),
        ),
        migrations.AddIndex(
            model_name='useractivitylog',
            index=models.Index(fields=['user_name', 'created_at'], name='heritage_us_user_na_8b8b7a_idx'),
        ),
    ]