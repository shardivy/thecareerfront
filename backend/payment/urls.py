from django.urls import path

from payment.views import GenerateReceiptByHandHoldingParticipantAPIView, GenerateReceiptByStudentAPIView, HandHoldingPaymentReminderAPI, HandholdingPaymentProgressAPIView, PaymentCreateAPIView, PaymentCreateByStudentAPIView, PaymentListAPIView, PaymentLogListAPIView, PaymentProofFileView, PaymentReminderAPI, PaymentStatsAPIView, PendingHandHoldingParticipantsAPIView, PendingPaymentUsersAPIView, StudentPackagePaymentSummaryAPIView, StudentPaymentDetailAPIView, StudentPaymentListAPIView, StudentPaymentProgressAPIView, UpdatePaymentStatusAPIView, VerifyPaymentAPIView


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
        "payments/participant/<int:participant_id>/",
        StudentPaymentListAPIView.as_view(),
        name="participant-payment-list"
    ),
    path(
        "student/<int:student_id>/payment-progress/",
        StudentPaymentProgressAPIView.as_view(),
        name="student-payment-progress"
    ),
    path(
        "participant/<int:participant_id>/payment-progress/",
        HandholdingPaymentProgressAPIView.as_view(),
        name="participant-payment-progress"
    ),
    path(
    "student-payment-summary/<int:student_id>/<int:package_id>/",
    StudentPackagePaymentSummaryAPIView.as_view(),
    name="student-package-payment-summary"
),
    path(
    "participant-payment-summary/<int:participant_id>/<int:package_id>/",
    StudentPackagePaymentSummaryAPIView.as_view(),
    name="participant-package-payment-summary"
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
    path(
    "students/<int:student_id>/payment-reminder/",
    PaymentReminderAPI.as_view(),
    name="payment-reminder",
),   
    path(
        "handholding/<int:participant_id>/payment-reminder/",
        HandHoldingPaymentReminderAPI.as_view(),
        name="handholding-payment-reminder"
    ),
    path(
        "handholding/pending-participants/",
        PendingHandHoldingParticipantsAPIView.as_view(),
        name="pending-handholding-participants"
    ),
    path("receipt/<int:student_id>/", GenerateReceiptByStudentAPIView.as_view()), 
    path("handholding/receipt/<int:participant_id>/", GenerateReceiptByHandHoldingParticipantAPIView.as_view()),
    
    path(
    "payment/create/student/<int:student_id>/",
    PaymentCreateByStudentAPIView.as_view()
),

# path(
#     "payment/create/student/<int:student_id>/<int:payment_id>/",
#     PaymentCreateByStudentAPIView.as_view()
# ),
# ========================= Student Payment Summary API =========================

    path(
        "student-payment-detail/<int:student_id>/",
        StudentPaymentDetailAPIView.as_view(),
        name="student-payment-detail"
    ),


    
]
