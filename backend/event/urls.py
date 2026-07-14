from django.urls import path

from event.views import AddHandHoldingRegisterAPIView, AdvertisementCreateAPIView, AdvertisementDashboardCountAPIView, BookHandHoldingSessionAPIView, BookedRescheduledSlotsByDateAPIView, CancelSessionAPIView, CertificateDashboardCountAPIView, CertificateTemplateAPIView, CounsellorStudentBookingByIdAPIView, CreateHandHoldingSessionAPIView, DashboardStatsAPIView, EventCreateAPIView, EventDashboardCountAPIView, GenerateCertificateAPIView, HandHoldingParticipantListAPIView, HandHoldingRegisterAPIView, HandHoldingSessionListAPIView, IssuedCertificateAPIView, MarkEventCompletedAPIView, MarkSessionCompletedAPIView, ParticipantCertificateAPIView, ParticipantSessionListAPIView, ParticipantSessionProgressAPIView, PendingCertificateParticipantsAPIView, RescheduleSessionAPIView, SendHandHoldingReminderAPIView, SendReminderByEventAPIView

urlpatterns = [
    path('handholding/register/', HandHoldingRegisterAPIView.as_view(), name='handholding-register'),
    path('add-handholding/', AddHandHoldingRegisterAPIView.as_view(), name='add-handholding'),
    path('update/delete/handholding/<int:user_id>/', AddHandHoldingRegisterAPIView.as_view(), name='update-handholding'),
    path('card-count/', DashboardStatsAPIView.as_view(), name='dashboard-stats'),
    
    path("handholding-session/", CreateHandHoldingSessionAPIView.as_view()),
    path("handholding-session/<int:session_id>/", CreateHandHoldingSessionAPIView.as_view()),
    path("handholding-participants/", HandHoldingParticipantListAPIView.as_view()),
    path("handholding-participants/<int:participant_id>/", HandHoldingParticipantListAPIView.as_view()),
    path("handholding/booked-rescheduled/<str:date>/",BookedRescheduledSlotsByDateAPIView.as_view(), name="booked-rescheduled-slots-by-date"),
    path("handholding/book-session/",BookHandHoldingSessionAPIView.as_view(),name="book-handholding-session"),
    path("mark-session-completed/",MarkSessionCompletedAPIView.as_view(),name="mark-session-completed"),
    path("reschedule-session/",RescheduleSessionAPIView.as_view(),name="reschedule-session"),
    path("cancel-session/",CancelSessionAPIView.as_view(),name="cancel-session"),
    path("participant-sessions/<int:participant_id>/",ParticipantSessionListAPIView.as_view(),name="participant-session-list"),
    path("participants/",HandHoldingSessionListAPIView.as_view(),name="handholding-participants"),
    path("single-participant/<int:participant_id>/",ParticipantSessionListAPIView.as_view(),name="participant-sessions"),
    path('participant-session-progress/<int:participant_id>/',ParticipantSessionProgressAPIView.as_view(),name='participant-session-progress'),
    
    path("handholding/counsellor-bookings/<int:counsellor_id>/", CounsellorStudentBookingByIdAPIView.as_view()),
    path(
        "send-handholding-reminder/<int:participant_id>/<int:session_no>/",
        SendHandHoldingReminderAPIView.as_view(),
        name="send-handholding-reminder"
    ),
    
    # ================ Advertisement URLs ====================
    
    path("stats/", AdvertisementDashboardCountAPIView.as_view(), name="advertisement-dashboard-stats"),
    path("advertisement/", AdvertisementCreateAPIView.as_view(), name="create-advertisement"),
    path('advertisement/<int:ad_id>/', AdvertisementCreateAPIView.as_view()),
    
    # ===================== Certificate URLs ====================
    
    path("certificate-template/", CertificateTemplateAPIView.as_view(), name="certificate-template"),
    path("certificate-template/<int:pk>/", CertificateTemplateAPIView.as_view(), name="certificate-template-detail"),
    path("generate-certificates/", GenerateCertificateAPIView.as_view()),
    path("issued-certificates/", IssuedCertificateAPIView.as_view()),
    path('pending-certificates/', PendingCertificateParticipantsAPIView.as_view()),
    path("certificates/participant/<int:participant_id>/",ParticipantCertificateAPIView.as_view(),name="participant-certificates"),
    path('certificate-stats/', CertificateDashboardCountAPIView.as_view(), name='certificate-dashboard-stats'),
    
    # ============================ Event URLs ============================
    
    path('event-dashboard-count/', EventDashboardCountAPIView.as_view()),
    path("events/", EventCreateAPIView.as_view(), name="create-event"),
    path("events/<int:event_id>/", EventCreateAPIView.as_view(), name="event-detail"),
    path('send-reminder/<int:event_id>/', SendReminderByEventAPIView.as_view()),
    path('mark-event-completed/<int:event_id>/', MarkEventCompletedAPIView.as_view()),
    
]