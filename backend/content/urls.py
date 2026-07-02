from django.urls import path

from content.views import AssignStreamAndContentAPIView, ContentByProgramPackageStreamAPIView, ContentDashboardAPIView, ContentDownloadAPIView, ContentFileView, ContentUploadAPIView, ProgramContentAPIView, StudentAssignedContentAPIView

urlpatterns = [
    path("upload-content/", ContentUploadAPIView.as_view(), name="upload-content"),
    path("upload-content/<int:content_id>/", ContentUploadAPIView.as_view()),
    path(
        "contents/",
        ContentByProgramPackageStreamAPIView.as_view(),
        name="contents-by-program-package-stream"
    ),
    path("content-file/<int:content_id>/", ContentFileView.as_view(), name="content-file-view"),
    path('count/', ContentDashboardAPIView.as_view(), name='content-count'),
    path(
        "download/<int:content_id>/",
        ContentDownloadAPIView.as_view(),
        name="content-download"
    ),
    path("program-content/", ProgramContentAPIView.as_view()),
    
    path(
        "assign-stream-content/",
        AssignStreamAndContentAPIView.as_view(),
        name="assign-stream-content"
    ),
    path(
        "student-content/<int:student_id>/",
        StudentAssignedContentAPIView.as_view(),
        name="student-content"
    ),
]