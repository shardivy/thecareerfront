from django.contrib import admin

from program_package.models import Package, PackageExam, PackageFeature, Program, UserProgramPackage

@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    
@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "program", "price", "is_active", "created_at")
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
