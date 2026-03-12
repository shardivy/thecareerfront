from django.urls import path

from payment.views import PaymentCreateAPIView, PaymentListAPIView, PaymentLogListAPIView, PaymentProofFileView, PaymentStatsAPIView, PendingPaymentUsersAPIView, StudentPackagePaymentSummaryAPIView, StudentPaymentDetailAPIView, StudentPaymentListAPIView, StudentPaymentProgressAPIView, UpdatePaymentStatusAPIView, VerifyPaymentAPIView


urlpatterns = [
    path("payments/", PaymentCreateAPIView.as_view(), name="payment-create"),
    path("payments/<int:pk>/", PaymentCreateAPIView.as_view()),
    # path("payments/<int:payment_id>/", PaymentUpdateAPIView.as_view(), name="payment-update"),
    path("verify-payment/<int:payment_id>/", VerifyPaymentAPIView.as_view(), name="verify-payment"),
    path('list-payments/', PaymentListAPIView.as_view(), name='payment-list'),
    path(
    "payment/report/image/<int:payment_id>/",
    PaymentProofFileView.as_view(),
    name="payment-report-image"
),
    
    path('payments-count/', PaymentStatsAPIView.as_view(), name='payment-count'),
    
    path("payments/<int:payment_id>/logs/", PaymentLogListAPIView.as_view(), name="payment-logs"),
    path(
        "payments/student/<int:student_id>/",
        StudentPaymentListAPIView.as_view(),
        name="student-payment-list"
    ),
    path(
    "student/<int:student_id>/payment-progress/",
    StudentPaymentProgressAPIView.as_view(),
    name="student-payment-progress"
),
    path(
    "student-payment-summary/<int:student_id>/<int:package_id>/",
    StudentPackagePaymentSummaryAPIView.as_view(),
    name="student-package-payment-summary"
),
    path(
    "payments/<int:pk>/update-status/",
    UpdatePaymentStatusAPIView.as_view(),
    name="update-payment-status",
),
    path(
    "pending-payments/",
    PendingPaymentUsersAPIView.as_view(),
    name="pending-payments"
),
    
# ========================= Student Payment Summary API =========================

    path(
        "student-payment-detail/<int:student_id>/",
        StudentPaymentDetailAPIView.as_view(),
        name="student-payment-detail"
    ),


    
]
