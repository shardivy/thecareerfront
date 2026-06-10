from django.contrib import admin

from report.models import Report, Review



@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'program',
        'package',
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

    # ordering = ('-uploaded_at',)
    
@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        # 'related_type',
        # 'related_id',
        'review_status',
        # 'rating',
        # 'is_shared',
        'created_at'
    )

    list_filter = (
        'review_status',
        # 'related_type',
        # 'is_shared',
        'created_at'
    )

    search_fields = (
        'user__first_name',
        'user__last_name',
        'user__email',
        'review_text'
    )

    # ordering = ('-created_at',)
