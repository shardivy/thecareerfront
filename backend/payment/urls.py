from django.urls import path

from payment.views import PaymentCreateAPIView, PaymentListAPIView, PaymentLogListAPIView, PaymentStatsAPIView, VerifyPaymentAPIView


urlpatterns = [
    path("payments/", PaymentCreateAPIView.as_view(), name="payment-create"),
    path("payments/<int:pk>/", PaymentCreateAPIView.as_view()),
    # path("payments/<int:payment_id>/", PaymentUpdateAPIView.as_view(), name="payment-update"),
    path("verify-payment/<int:payment_id>/", VerifyPaymentAPIView.as_view(), name="verify-payment"),
    path('list-payments/', PaymentListAPIView.as_view(), name='payment-list'),
    
    path('payments-count/', PaymentStatsAPIView.as_view(), name='payment-count'),
    
    path("payments/<int:payment_id>/logs/", PaymentLogListAPIView.as_view(), name="payment-logs"
),

    
]
