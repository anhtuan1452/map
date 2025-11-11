from django.contrib import admin
from .models import Site, Feedback


@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = ['site_id', 'name', 'created']
    list_filter = ['created']
    search_fields = ['site_id', 'name']
    readonly_fields = ['created']


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ['site', 'name', 'category', 'created']
    list_filter = ['category', 'created']
    search_fields = ['site__name', 'name', 'message']
    readonly_fields = ['created']