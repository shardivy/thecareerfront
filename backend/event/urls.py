from django.urls import path

from event.views import AdvertisementCreateAPIView, BookHandHoldingSessionAPIView, BookedRescheduledSlotsByDateAPIView, CancelSessionAPIView, CreateHandHoldingSessionAPIView, GenerateCertificateAPIView, HandHoldingParticipantListAPIView, HandHoldingRegisterAPIView, HandHoldingSessionListAPIView, MarkSessionCompletedAPIView, ParticipantSessionListAPIView, RescheduleSessionAPIView

urlpatterns = [
    path('handholding/register/', HandHoldingRegisterAPIView.as_view(), name='handholding-register'),
    
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
    path(
    "single-participant/<int:participant_id>/",
    ParticipantSessionListAPIView.as_view(),
    name="participant-sessions"
),
    
    # ================ Advertisement URLs ====================
    
    path("advertisement/", AdvertisementCreateAPIView.as_view(), name="create-advertisement"),
    
    # ===================== Certificate URLs ====================
    
    path("generate-certificates/", GenerateCertificateAPIView.as_view())
    
]