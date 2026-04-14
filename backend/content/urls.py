from django.urls import path

from content.views import ContentDashboardAPIView, ContentDownloadAPIView, ContentFileView, ContentUploadAPIView, ProgramContentAPIView

urlpatterns = [
    path("upload-content/", ContentUploadAPIView.as_view(), name="upload-content"),
    path("upload-content/<int:content_id>/", ContentUploadAPIView.as_view()),
    path("content-file/<int:content_id>/", ContentFileView.as_view(), name="content-file-view"),
    path('count/', ContentDashboardAPIView.as_view(), name='content-count'),
    path(
    "download/<int:content_id>/",
    ContentDownloadAPIView.as_view(),
    name="content-download"
),
    path("program-content/", ProgramContentAPIView.as_view())
]