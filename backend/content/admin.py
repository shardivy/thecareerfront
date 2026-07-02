from django.contrib import admin

from content.models import Content, ContentPackage, StudentContent

# =========================
# Content Admin
# =========================
@admin.register(Content)
class ContentAdmin(admin.ModelAdmin):
    
    list_display = (
        "id",
        "title",
        "type",
        "category",
        # "get_programs",
        "free_content",
        "is_student_visible",
        "payment_required",
        "is_active",
        "created_by",
    )

    list_filter = (
        "type",
        "category",
        # "program",   # ✅ correct field name
        "free_content",
        "payment_required",
        "is_active",
    )

    search_fields = (
        "title",
        "description",
        # "program__name",   # ✅ correct relation
    )

    ordering = ("-id",)

    # ✅ show multiple programs
    # def get_programs(self, obj):
    #     return ", ".join([p.name for p in obj.program.all()])

    # get_programs.short_description = "Programs" 
# =========================
# ContentPackage Admin
# =========================
@admin.register(ContentPackage)
class ContentPackageAdmin(admin.ModelAdmin):

    list_display = ("id", "content", "program", "package", "stream")
    search_fields = ("content__title", "program__name", "package__name", "stream__name")
    autocomplete_fields = ["content", "program", "package", "stream"]
    
@admin.register(StudentContent)
class StudentContentAdmin(admin.ModelAdmin):
    list_display = ("id", "student_profile", "content", "created_at")
    search_fields = ("student__user__first_name", "student__user__last_name")
