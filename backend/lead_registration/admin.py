from django.contrib import admin

from lead_registration.models import Lead, ParentProfile, StudentProfile

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'parent',
        'study_class',
        'current_academic_stage',
        'current_academic_year',
        'city',
        'created_at'
    )
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    list_filter = ('study_class', 'city', 'created_at')

@admin.register(ParentProfile)
class ParentProfileAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'profession',
        'education_level',
        'background',
        'annual_income_range',
        'created_at'
    )
    search_fields = ('user__email', 'profession', 'organization_name')
    list_filter = ('background', 'created_at')


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'first_name',
        'last_name',
        'phone',
        'email',
        'source',
        'status',
        'assigned_admin',
        'created_at'
    )
    list_filter = ('source', 'status', 'created_at')
    search_fields = ('first_name','last_name', 'phone', 'email')
    ordering = ('-created_at',)

