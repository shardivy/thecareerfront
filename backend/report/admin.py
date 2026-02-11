from django.contrib import admin

from report.models import Report



@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'exam',
        'report_status',
        'review_required',
        'uploaded_by',
        'uploaded_at',
    )

    list_filter = (
        'report_status',
        'review_required',
        'uploaded_at',
    )

    search_fields = (
        'user__first_name',
        'user__last_name',
        'user__email',
        'exam__name',
        'uploaded_by__email',
    )

    readonly_fields = ('uploaded_at',)

    ordering = ('-uploaded_at',)
