from django.contrib import admin

from exam.models import Exam, UserExam



@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "provider", "is_active", "created_at")
    list_filter = ("provider", "is_active")
    search_fields = ("name", "provider")
    list_editable = ("is_active",)
    # list_per_page = 25
    
@admin.register(UserExam)
class UserExamAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "exam", "status", "completed_at", "approved_by")
    list_filter = ("status", "exam")
    search_fields = ("user__username", "user__email", "exam__name")
    autocomplete_fields = ("user", "exam", "approved_by")
    readonly_fields = ("completed_at",)
    ordering = ("-completed_at",)