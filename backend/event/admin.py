from django.contrib import admin
from .models import (
    CertificateTemplate,
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

    # =========================
    # 🔹 LIST DISPLAY
    # =========================
    list_display = (
        "id",
        "seminar_webinar_name",
        "event_type",
        "event_mode",
        "venue_type",
        "event_start_date",
        "event_end_date",
        "session_status",
        "is_paid",
        "amount",
        "conducted_by",
        "created_at",
    )

    # =========================
    # 🔹 FILTERS
    # =========================
    list_filter = (
        "event_type",
        "event_mode",
        "venue_type",
        "session_status",
        "is_paid",
        "created_at",
    )

    # =========================
    # 🔹 SEARCH
    # =========================
    search_fields = (
        "seminar_webinar_name",
        "concerned_person_name",
        "concerned_person_email",
        "transaction_id",
    )
    
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
        "id", "slot", "handholding_participant", "session_no", "handholding_session",
        "session_date", "status", "conducted_by"
    )
    list_filter = ("status", "session_date")
    search_fields = ("handholding_participant__email",)
    # ordering = ("session_no",)

@admin.register(CertificateTemplate)
class CertificateTemplateAdmin(admin.ModelAdmin):
    
    list_display = (
        "id",
        "name",
        "template_preview",
        "name_position",
        "date_position",
        "name_font_size",
        "date_font_size",
        "text_color",
        "created_at",
    )

    list_filter = ("created_at",)

    search_fields = ("name",)

    readonly_fields = ("created_at", "template_preview")

    fieldsets = (
        ("Basic Info", {
            "fields": ("name", "template_file", "template_preview")
        }),
        ("Name Position", {
            "fields": ("name_x", "name_y", "name_font_size")
        }),
        ("Date Position", {
            "fields": ("date_x", "date_y", "date_font_size")
        }),
        ("Style", {
            "fields": ("text_color",)
        }),
        ("Meta", {
            "fields": ("created_at",)
        }),
    )

    # =========================
    # 🔍 Template Preview in Admin
    # =========================
    def template_preview(self, obj):
        if obj.template_file:
            return f'<img src="{obj.template_file.url}" width="200" />'
        return "-"
    
    template_preview.allow_tags = True
    template_preview.short_description = "Preview"

    # =========================
    # 📍 Position Display
    # =========================
    def name_position(self, obj):
        return f"({obj.name_x}, {obj.name_y})"
    
    name_position.short_description = "Name Position"

    def date_position(self, obj):
        return f"({obj.date_x}, {obj.date_y})"
    
    date_position.short_description = "Date Position"


# ✅ Certificate Admin
@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ("user", "program_type", "certificate_status", "issued_at")
    list_filter = ("program_type", "certificate_status")
    search_fields = ("user__email",)


# ✅ Advertisement Admin
@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    list_display = (
        "id", "advertisement_name", "advertiser_name", "ad_platform",
        "ad_date",
        "amount", "ad_status"
    )
    list_filter = ("ad_status", "ad_platform")
    search_fields = ("advertiser_name", "contact_email")
    # ordering = ("-ad_date",)