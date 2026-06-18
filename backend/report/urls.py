from django.urls import path

from report.views import CompletedExamReportAPIView, CompletedExamReportExportExcelAPIView, CompletedExamReportExportPDFAPIView, CompletedExamReportStudentIDAPIView, EngineeringReportUploadAPIView, EngineeringTestAnalysisReportAPIView, EngineeringV2ReportUploadAPIView, GetReviewStatusAPIView, ReportPDFView, ReportStatusCountAPIView, ReviewStartByStudentAPIView, StudentReportUploadAPIView, SubmitReviewAPIView, UploadReportAPIView



urlpatterns = [
    path('reports/completed-exams/', CompletedExamReportAPIView.as_view()),
    path('reports/completed-exams/<int:student_id>/', CompletedExamReportStudentIDAPIView.as_view()),
    path('upload/<int:report_id>/', UploadReportAPIView.as_view()),
    path('reports/status-count/', ReportStatusCountAPIView.as_view()),
    path("report/pdf/<int:report_id>/", ReportPDFView.as_view(), name="report-pdf"),
    path("report/v1/pdf/<int:report_id>/", ReportPDFView.as_view(), name="report-v1-pdf"),
    path("report/v2/pdf/<int:report_id>/", ReportPDFView.as_view(), name="report-v2-pdf"),

    path("export/excel/", CompletedExamReportExportExcelAPIView.as_view()),
    path("export/pdf/", CompletedExamReportExportPDFAPIView.as_view()),
    
    # ================= Engineering report urls =================
    
    path('engineering/reports/completed-exams/', EngineeringTestAnalysisReportAPIView.as_view(), name='engineering-completed-exams'),
    path('engineering/upload/<int:report_id>/', EngineeringReportUploadAPIView.as_view(), name='engineering-report-upload'),
    path(
        "student-report-upload/<int:student_id>/",
        StudentReportUploadAPIView.as_view(),
        name="student-report-upload",
    ),
    path('engineering-v2/upload/<int:report_id>/', EngineeringV2ReportUploadAPIView.as_view(), name='engineering-v2-report-upload'),


    # =================== New API for Report Review =================
    
    path('review/start-by-student/', ReviewStartByStudentAPIView.as_view(), name='review-start-by-student'),
    path('review/submit/<int:review_id>/', SubmitReviewAPIView.as_view(), name='submit-review'),
    path('review/status/<int:student_id>/', GetReviewStatusAPIView.as_view(), name='review-status'),
    
]
