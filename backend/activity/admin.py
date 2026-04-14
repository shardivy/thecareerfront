from django.contrib import admin

from activity.signals import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "action",
        "module",
        "model_name",
        "object_id",
        "created_at",
    )

    list_filter = (
        "action",
        "module",
        "model_name",
        "created_at",
    )

    search_fields = (
        "user__username",
        "module",
        "model_name",
        "description",
    )

    readonly_fields = ("created_at",)

    ordering = ("-created_at",)

    # list_per_page = 25
