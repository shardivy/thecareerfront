from django.contrib import admin

from counselling_slot.models import Booking, BookingCounsellor, CounsellingNote, Counsellor, Slot

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
        "counsellor",
        "date",
        "start_time",
        "end_time",
        "mode",
        "is_available",
        "is_handholding_session_available",
        "created_at",
    )

    list_filter = (
        "mode",
        "is_available",
        "date",
        "created_at",
    )

    search_fields = (
        "counsellor__email",
        "counsellor__first_name",
        "counsellor__last_name",
    )

    ordering = ("-date", "-created_at")

    readonly_fields = ("created_at", "updated_at")


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student",
        "program",
        # "package",
        "slot",
        "status",
        "date",
        "created_at",
    )

    list_filter = (
        "status",
        "date",
        "created_at",
    )

    search_fields = (
        "student__user__email",
        "student__user__first_name",
        "student__user__last_name",
        "counsellor__user__email",
    )

    ordering = ("-created_at",)

    readonly_fields = ("created_at", "updated_at")
    
    
@admin.register(BookingCounsellor)
class BookingCounsellorAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "booking",
        "counsellor",
        "role",
        "assigned_at",
    )

    list_filter = (
        "role",
        "assigned_at",
    )

    search_fields = (
        "booking__id",
        "counsellor__email",
        "counsellor__first_name",
        "counsellor__last_name",
    )

    ordering = ("-assigned_at",)

    readonly_fields = ("assigned_at",)


@admin.register(CounsellingNote)
class CounsellingNoteAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "booking",
        "counsellor",
        "created_at",
    )

    list_filter = (
        "created_at",
    )

    search_fields = (
        "booking__id",
        "counsellor__email",
        "counsellor__first_name",
        "counsellor__last_name",
        "notes",
    )

    ordering = ("-created_at",)

    readonly_fields = ("created_at",)