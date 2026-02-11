from django.contrib import admin

from counselling_slot.models import Booking, Counsellor, Slot

@admin.register(Counsellor)
class CounsellorAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "specialization",
        "is_active",
    )
    list_filter = ("is_active",)
    search_fields = (
        "user__first_name",
        "user__last_name",
        "user__email",
        "specialization",
    )


@admin.register(Slot)
class SlotAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "lead_counsellor",
        "normal_counsellor",
        "date",
        "start_time",
        "end_time",
        "mode",
        "duration_minutes",
        "is_available",
    )

    list_filter = (
        "mode",
        "is_available",
        "date",
    )

    search_fields = (
        "lead_counsellor__user__first_name",
        "lead_counsellor__user__last_name",
        "normal_counsellor__user__first_name",
        "normal_counsellor__user__last_name",
    )

    ordering = ("-date", "-start_time")

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student",
        "get_counsellors",  # Combined column for lead + normal counsellor
        "slot",
        "date",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "student__first_name",
        "student__last_name",
        "student__email",
        "lead_counsellor__user__first_name",
        "lead_counsellor__user__last_name",
        "normal_counsellor__user__first_name",
        "normal_counsellor__user__last_name",
    )

    ordering = ("-created_at",)

    # Method to combine lead + normal counsellor for list_display
    def get_counsellors(self, obj):
        if obj.lead_counsellor and obj.lead_counsellor.user:
            lead_user = obj.lead_counsellor.user
            lead = f"{lead_user.first_name} {lead_user.last_name}".strip()
        else:
            lead = "N/A"

        if obj.normal_counsellor and obj.normal_counsellor.user:
            normal_user = obj.normal_counsellor.user
            normal = f"{normal_user.first_name} {normal_user.last_name}".strip()
        else:
            normal = "N/A"

        return f"Lead: {lead}, Normal: {normal}"
