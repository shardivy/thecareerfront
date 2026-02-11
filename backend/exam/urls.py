from django.urls import path

from exam.views import AddExamToPackageAPIView, ApproveUserExamAPIView, ExamCreateAPIView, RejectUserExamAPIView, UserExamCreateAPIView, UserExamListAPIView


urlpatterns = [
    path("add-exams/", ExamCreateAPIView.as_view(), name="exam-create"),
    path("assign-exam/",UserExamCreateAPIView.as_view(), name="assign-exam-to-user"),
    
    path("package-exams/", AddExamToPackageAPIView.as_view(), name="package-exam-list-create"),
    path("package-exams/<int:pk>/", AddExamToPackageAPIView.as_view(), name="package-exam-update"),

    path("user-exams/", UserExamListAPIView.as_view(), name="user-exam-list"),
    path("user-exams/<int:pk>/approve/", ApproveUserExamAPIView.as_view(),name="approve-user-exam"),
    path("user-exams/<int:pk>/reject/", RejectUserExamAPIView.as_view(),name="reject-user-exam" ),
    
]