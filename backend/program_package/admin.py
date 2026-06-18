from django.contrib import admin

from program_package.models import Answer, CollegeListAnalysis, LandingPage, Package, PackageExam, PackageFeature, Program, QuestionAnswer, UserProgramPackage

@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    
@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "program", "price", "aptitude_test", "engineering_test_analysis", "is_active", "created_at")
    list_filter = ("program", "is_active")
    search_fields = ("name", "program__name")
    list_editable = ("is_active",)
    readonly_fields = ("created_at", "updated_at")
    
@admin.register(PackageFeature)
class PackageFeatureAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "package",
        "feature_code",
        "description",
        "is_enabled",
    )
    list_filter = ("is_enabled", "package")
    search_fields = ("feature_code", "description", "package__name")
    list_editable = ("is_enabled",)


@admin.register(UserProgramPackage)
class UserProgramPackageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "program",
        "package",
        "assigned_by",
        "created_at",
    )
    list_filter = ("program", "package", "assigned_by")
    search_fields = (
        "user__first_name",
        "user__last_name",
        "user__email",
        "program__name",
        "package__name",
    )
    readonly_fields = ("created_at",)


@admin.register(PackageExam)
class PackageExamAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "package",
        "exam",
        "is_mandatory",
        "sequence_order",
        "created_at",
    )
    list_filter = ("package", "is_mandatory")
    search_fields = ("package__name", "exam__name")
    list_editable = ("is_mandatory", "sequence_order")
    ordering = ("package", "sequence_order")
    readonly_fields = ("created_at",)
    
@admin.register(CollegeListAnalysis)
class CollegeListAnalysisAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'question',
        'program',
        'package',
        'status',
        'assigned_by',
        'created_at',
    )

    list_filter = (
        'status',
        'program',
        'package',
        'created_at',
    )

    search_fields = (
        'user__email',
        'user__first_name',
        'user__last_name',
        'program__name',
        'package__name',
    )

    readonly_fields = (
        'created_at',
        'updated_at',
    )

    # ordering = ('-created_at',)


@admin.register(QuestionAnswer)
class QuestionAnswerAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'question',
        'created_at',
    )

    list_filter = (
        'created_at',
    )

    search_fields = (
        'user__email',
        'question',
    )

    readonly_fields = (
        'created_at',
        'updated_at',
    )

    # ordering = ('-created_at',)

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "student",
        "program",
        "package",
        "question",
        "answer_text",
        "created_at",
    )

    list_filter = (
        "created_at",
    )

    search_fields = (
        "student__user__first_name",
        "student__user__last_name",
        "question__question",
        "answer_text",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    # ordering = ("-created_at",)
    
@admin.register(LandingPage)
class LandingPageAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "program",
        "package",
        "enterprise_name",
        "flyer_image",
        "created_at",
        "updated_at",
    )

    list_filter = (
        "program",
        "package",
        "created_at",
    )

    search_fields = (
        "enterprise_name",
        "contact_details",
        "description",
    )

    
