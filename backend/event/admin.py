from django.contrib import admin
from .models import (
    Event,
    HandHoldingParticipant,
    HandHoldingParticipantSession,
    HandHoldingSession,
    Certificate,
    Advertisement
)


# ✅ Event Admin
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        "title", "event_type", "event_mode",
        "event_date", "status", "conducted_by"
    )
    list_filter = ("event_type", "event_mode", "status")
    search_fields = ("title", "institute_name", "concerned_person_name")
    # ordering = ("-event_date",)
    
@admin.register(HandHoldingSession)
class HandHoldingSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "created_at", "updated_at")
    search_fields = ("title", "description")
    # ordering = ("-created_at",)


# ✅ HandHoldingParticipant Admin
@admin.register(HandHoldingParticipant)
class HandHoldingParticipantAdmin(admin.ModelAdmin):
    list_display = (
        "id","email", "mobile", "city",
        "preferred_counselling_mode", "status", "total_sessions",
        "completed_sessions", "created_at"
    )
    list_filter = ("preferred_counselling_mode", "status", "city")
    search_fields = ("email", "mobile", "city")
    readonly_fields = ("completed_sessions", "created_at")


# ✅ HandHoldingSession Inline (inside participant)
class HandHoldingSessionInline(admin.TabularInline):
    model = HandHoldingParticipantSession
    extra = 1


# ✅ HandHoldingSession Admin
@admin.register(HandHoldingParticipantSession)
class HandHoldingSessionAdmin(admin.ModelAdmin):
    list_display = (
        "id", "handholding_participant", "session_no", "handholding_session",
        "session_date", "status", "conducted_by"
    )
    list_filter = ("status", "session_date")
    search_fields = ("handholding_participant__email",)
    # ordering = ("session_no",)


# ✅ Certificate Admin
@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ("user", "program_type", "issued_at")
    list_filter = ("program_type",)
    search_fields = ("user__email",)


# ✅ Advertisement Admin
@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    list_display = (
        "id", "advertisement_name", "advertiser_name", "ad_platform",
        "ad_start_date", "ad_end_date",
        "amount", "ad_status"
    )
    list_filter = ("ad_status", "ad_platform")
    search_fields = ("advertiser_name", "contact_email")
    # ordering = ("-ad_start_date",)