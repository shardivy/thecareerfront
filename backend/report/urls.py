from django.urls import path

from report.views import CompletedExamReportAPIView, CompletedExamReportExportExcelAPIView, CompletedExamReportExportPDFAPIView, CompletedExamReportStudentIDAPIView, EngineeringReportUploadAPIView, EngineeringTestAnalysisReportAPIView, ReportPDFView, ReportStatusCountAPIView, UploadReportAPIView



urlpatterns = [
    path('reports/completed-exams/', CompletedExamReportAPIView.as_view()),
    path('reports/completed-exams/<int:student_id>/', CompletedExamReportStudentIDAPIView.as_view()),
    path('upload/<int:report_id>/', UploadReportAPIView.as_view()),
    path('reports/status-count/', ReportStatusCountAPIView.as_view()),
    path("report/pdf/<int:report_id>/", ReportPDFView.as_view(), name="report-pdf"),

    path("export/excel/", CompletedExamReportExportExcelAPIView.as_view()),
    path("export/pdf/", CompletedExamReportExportPDFAPIView.as_view()),
    
    # ================= Engineering report urls =================
    
    path('engineering/reports/completed-exams/', EngineeringTestAnalysisReportAPIView.as_view(), name='engineering-completed-exams'),
    path('engineering/upload/<int:report_id>/', EngineeringReportUploadAPIView.as_view(), name='engineering-report-upload'),

]
