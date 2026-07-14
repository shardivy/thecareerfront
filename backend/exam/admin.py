from django.contrib import admin

from exam.models import CareerFuturaTest, Exam, UserExam



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
    
@admin.register(CareerFuturaTest)
class CareerFuturaTestAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "created_at")
    list_filter = ("created_at",)
    search_fields = ("student__user__first_name", "student__user__last_name", "student__user__email")
    autocomplete_fields = ("student",)
    readonly_fields = ("created_at",)