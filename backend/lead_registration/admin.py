from django.contrib import admin

from lead_registration.models import Hobby, Lead, ParentProfile, Stream, StudentAcademicHistory, StudentHobby, StudentProfile, StudentStream, StudentSubjectPreference, Subject

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
        'father_background',
        'mother_background',
        'location',
        'annual_income_range',
        'created_at'
    )
    search_fields = ('user__email', 'profession', 'organization_name')
    list_filter = ('father_background', 'mother_background', 'location', 'created_at')


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'first_name',
        'last_name',
        'phone',
        'email',
        'source',
        'specialization',
        'stream',
        'status',
        'assigned_admin',
        'created_at'
    )
    list_filter = ('source', 'status', 'created_at')
    search_fields = ('first_name','last_name', 'phone', 'email')
    ordering = ('-created_at',)
    
@admin.register(StudentAcademicHistory)
class StudentAcademicHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student_email",
        "academic_stage",
        "start_year",
        "end_year",
        "board_name",
        "coaching_entrance",
        "current_class_percentage",
        "special_notes",
        "is_current",
        "created_at",
    )

    list_filter = ("academic_stage", "is_current")
    search_fields = ("student_profile__user__email",)
    ordering = ("-created_at",)

    def student_email(self, obj):
        return obj.student_profile.user.email

    student_email.short_description = "Student Email"

@admin.register(Stream)
class StreamAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "is_active", "created_at")
    search_fields = ("name",)

@admin.register(StudentStream)
class StudentStreamAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student_email",
        "stream",
        "created_at",
    )

    search_fields = (
        "student_profile__user__email",
        "stream__name",
    )

    list_filter = ("stream",)

    def student_email(self, obj):
        return obj.student_profile.user.email

    student_email.short_description = "Student Email"

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)

@admin.register(StudentSubjectPreference)
class StudentSubjectPreferenceAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student_email",
        "subject",
        "preference_type",
        "created_at",
    )

    list_filter = ("preference_type", "subject")
    search_fields = (
        "student_profile__user__email",
        "subject__name",
    )

    def student_email(self, obj):
        return obj.student_profile.user.email

    student_email.short_description = "Student Email"

@admin.register(Hobby)
class HobbyAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)

@admin.register(StudentHobby)
class StudentHobbyAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student_email",
        "hobby",
        "created_at",
    )

    search_fields = (
        "student_profile__user__email",
        "hobby__name",
    )

    list_filter = ("hobby",)

    def student_email(self, obj):
        return obj.student_profile.user.email

    student_email.short_description = "Student Email"
