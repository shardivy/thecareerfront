from django.contrib import admin
from .models import Role, User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "email",
        "role",
        "is_staff",
        "is_active",
        "is_converted_lead",
        "created_at",
    )

    list_filter = (
        "role",
        "is_staff",
        "is_active",
    )

    search_fields = (
        "email",
        "phone",
    )

    ordering = ("-created_at",)

    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Basic Info", {
            "fields": (
                "email",
                "password",
                "original_password",
                "first_name",
                "last_name",
                "phone",
            )
        }),
        ("Role & Permissions", {
            "fields": (
                "role",
                "is_staff",
                "is_active",
                "is_converted_lead",
                "is_superuser",
                "groups",
                "user_permissions",
            )
        }),
        ("Timestamps", {
            "fields": (
                "created_at",
                "updated_at",
            )
        }),
    )
    
@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)

