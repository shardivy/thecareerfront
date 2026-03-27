from django.contrib import admin

from notification.models import Notification, NotificationLog




# =========================
# Notification Admin
# =========================
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "type",
        "title",
        "is_sent",
        "created_at",
    )

    list_filter = (
        "type",
        "is_sent",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
        "title",
        "message",
    )

    ordering = ("-created_at",)

    readonly_fields = ("created_at",)

    # list_per_page = 20
    

# =========================
# NotificationLog Admin
# =========================
@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "notification",
        "status",
        "sent_at",
    )

    list_filter = (
        "status",
        "sent_at",
    )

    search_fields = (
        "notification__title",
        "notification__message",
    )

    ordering = ("-sent_at",)

    readonly_fields = ("sent_at",)

    # list_per_page = 20
