from django.urls import path
from lead_registration.views import (
    AddEnquiryAPIView,
    AddUserAPIView,
    AdminUserFullUpdateAPIView,
    ConvertLeadAPIView,
    HobbyAPIView,
    LeadListAPIView,
    SendStudentOTPAPIView,
    StreamAPIView,
    StudentAcademicHistoryAPIView,
    StudentAcademicHistoryDetailAPIView,
    StudentHobbyAPIView,
    StudentHobbyDetailAPIView,
    StudentRegistrationAPIView,
    StudentStreamAPIView,
    StudentStreamDetailAPIView,
    StudentSubjectPreferenceAPIView,
    StudentSubjectPreferenceDetailAPIView,
    SubjectAPIView,
    UserJourneyAPIView,
    VerifyStudentOTPAPIView
)

urlpatterns = [
    path('student/register/', StudentRegistrationAPIView.as_view(), name='student-registration'),
    path("send-parent-otp/", SendStudentOTPAPIView.as_view()),
    path("verify-parent-otp/", VerifyStudentOTPAPIView.as_view()),
    
    path('add-enquiry/', AddEnquiryAPIView.as_view(), name='add-enquiry'),
    path('leads/', AddEnquiryAPIView.as_view(), name='delete-lead'),
    path("all-leads/", LeadListAPIView.as_view(), name="lead-list"), 
    path('leads/<int:pk>/', AddEnquiryAPIView.as_view(), name='update-enquiry'),
    
    path('add-users/', AddUserAPIView.as_view(), name='add-users'),
    path('add-users/<int:id>/', AddUserAPIView.as_view(), name='add-users'),
    path('update-user/<int:user_id>/', AdminUserFullUpdateAPIView.as_view(), name="update-user"),
    
    path("leads/<int:lead_id>/convert/", ConvertLeadAPIView.as_view(), name="convert-to-user"),
    
    # ==================== Student Academic History URLs ====================
    path('students/<int:student_id>/academic-history/', StudentAcademicHistoryAPIView.as_view(), name='student-academic-history'),
    path('students/<int:student_id>/academic-history/<int:history_id>/', StudentAcademicHistoryDetailAPIView.as_view(), name='student-academic-history-detail'),
    
    # ==================== Stream URLs ====================
    path("streams/", StreamAPIView.as_view()),
    path("streams/<int:stream_id>/", StreamAPIView.as_view()),
    path("students/<int:student_id>/streams/", StudentStreamAPIView.as_view()),
    path("students/<int:student_id>/streams/<int:stream_id>/", StudentStreamDetailAPIView.as_view()),

    # ==================== Subject URLs ====================
    path("subjects/", SubjectAPIView.as_view()),
    path("students/<int:student_id>/subjects/", StudentSubjectPreferenceAPIView.as_view()),
    path("students/<int:student_id>/subjects/<int:subject_id>/", StudentSubjectPreferenceDetailAPIView.as_view()),
    
    # ==================== Hobby URLs ====================
    path("hobbies/", HobbyAPIView.as_view()),
    path("students/<int:student_id>/hobbies/",StudentHobbyAPIView.as_view()),
    path("students/<int:student_id>/hobbies/<int:hobby_id>/",StudentHobbyDetailAPIView.as_view()),
    
    
    # path("student/journey/", UserJourneyAPIView.as_view(), name="student-journey")
    
    path('student/<int:student_id>/journey/', UserJourneyAPIView.as_view(), name='student-journey'),
    

    
    
]
