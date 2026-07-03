from django.urls import path

from exam.views import AddExamToPackageAPIView, ApproveUserExamAPIView, ExamCreateAPIView, ExamTrackerAPIView, FetchStudentExamStatusAPIView, LaunchTestAPIView, RejectUserExamAPIView, SaveCareerFuturaDetailsAPIView, StartExamAPIView, UpdateExamToPendingApprovalAPIView, UserExamCreateAPIView, UserExamListAPIView


urlpatterns = [
    path("add-exams/", ExamCreateAPIView.as_view(), name="exam-create"),
    path("assign-exam/",UserExamCreateAPIView.as_view(), name="assign-exam-to-user"),
    
    path("package-exams/", AddExamToPackageAPIView.as_view(), name="package-exam-list-create"),
    path("package-exams/<int:pk>/", AddExamToPackageAPIView.as_view(), name="package-exam-update"),

    path("user-exams/", UserExamListAPIView.as_view(), name="user-exam-list"),
    path("user-exams/<int:pk>/approve/", ApproveUserExamAPIView.as_view(),name="approve-user-exam"),
    path("user-exams/<int:pk>/reject/", RejectUserExamAPIView.as_view(),name="reject-user-exam" ),
    
    path(
    "student/<int:student_id>/send-for-approval/",
    UpdateExamToPendingApprovalAPIView.as_view(),
    name="update-exam-to-pending-approval"
),
    path("start-exam/<int:student_id>/", StartExamAPIView.as_view(), name="start-exam"),
    path("exam-status/<int:student_id>/", FetchStudentExamStatusAPIView.as_view(), name="exam-status"),
    path("exam-tracker/student/<int:student_id>/", ExamTrackerAPIView.as_view()),
    path(
        "save-career-futura-details/<int:student_id>/",
        SaveCareerFuturaDetailsAPIView.as_view(),
        name="save-career-futura-details",
    ),

    path(
        "launch-test/<int:student_id>/<int:test_id>/",
        LaunchTestAPIView.as_view(),
        name="launch-test",
    ),
    
]