# admin.py
from django.contrib import admin

from payment.models import Payment, PaymentLog


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id','user','amount','payment_type','method','status','payment_date',
                    'transaction_id','proof_file','verified_by','created_at','updated_at')
    list_filter = ('status','payment_type','method','payment_date','created_at')
    search_fields = ('user__first_name','user__last_name','user__email','transaction_id',
                     'package__name')
    readonly_fields = ('created_at','updated_at')
    ordering = ('-created_at',)
    
    def get_packages(self, obj):
        return ", ".join(
            obj.package.values_list("name", flat=True)
        )

    get_packages.short_description = "Packages"


@admin.register(PaymentLog)
class PaymentLogAdmin(admin.ModelAdmin):
    list_display = ('id','payment','old_status','new_status','changed_by','changed_at','created_at')
    list_filter = ('old_status','new_status','changed_at','created_at')
    search_fields = ('payment__id','changed_by__email')
    readonly_fields = ('changed_at','created_at')
    ordering = ('-changed_at',)