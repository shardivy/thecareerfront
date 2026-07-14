from django.urls import path

from program_package.views import  ActiveProgramListAPIView, AddProgramAPIView, AddQuestionAPIView, CollegeListAnalysisListAPIView, CollegeListAnalysisStatusAPIView, CreateLandingPageAPIView, DashboardCountAPIView, EngineeringAnalysisDashboardAPIView, ExcludeHandholdingProgramListAPIView, LandingPageByPackageAPIView, MultipleProgramPackagesAPIView, PackageCreateAPIView, PackageListAPIView, ProgramListAPIView, ProgramPackageDetailAPIView, ProgramPackagesAPIView, StartQuestionAPIView, SubmitMultipleAnswersAPIView, UpdateMultipleAnswersAPIView, UpdateProgramAPIView


urlpatterns = [
    path('get-programs/', ProgramListAPIView.as_view(), name='list-programs'),
    path("programs/active/", ActiveProgramListAPIView.as_view(), name="active-programs"),
    path("programs/exclude-handholding/", ExcludeHandholdingProgramListAPIView.as_view(), name="exclude-handholding-programs"),
    path('add-programs/', AddProgramAPIView.as_view(), name='add-program'),
    path('update-program/<int:program_id>/', UpdateProgramAPIView.as_view(), name='update-program'),
    path("programs/<int:program_id>/packages/",ProgramPackagesAPIView.as_view(),name="program-packages"),
    path(
        "multiple-program-packages/",
        MultipleProgramPackagesAPIView.as_view(),
        name="multiple-program-packages"
    ),
    
    # path('add-packages/', AddPackageAPIView.as_view(), name='add-package'),
    path("create-packages/", PackageCreateAPIView.as_view()),
    path("packages/<int:pk>/", PackageCreateAPIView.as_view()),
    path("get-packages/", PackageListAPIView.as_view()),
    
    path("dashboard/counts/", DashboardCountAPIView.as_view(), name="dashboard-counts"),
    
    path(
        "programs/<int:program_id>/packages/<int:package_id>/",
        ProgramPackageDetailAPIView.as_view(),
        name="program-package-detail"
    ),
    
    # path('update-packages/<int:package_id>/', AddPackageAPIView.as_view(), name='add-package'),
    
    # =================== College List Analysis URL ====================
    path("college-list-analysis/", CollegeListAnalysisListAPIView.as_view(), name="college-list-analysis"),
    path("questions/", AddQuestionAPIView.as_view(), name="add-question"),
    path("questions/<int:question_id>/", AddQuestionAPIView.as_view(), name="update-question"),
    path("college-analysis/start/<int:student_id>/",StartQuestionAPIView.as_view(), name="start-question"),
    path("submit-answers/", SubmitMultipleAnswersAPIView.as_view(), name="submit-answers"),
    path("answers/update/<int:student_id>/", UpdateMultipleAnswersAPIView.as_view(), name="update-multiple-answers"),
    path("college-analysis/status/<int:student_id>/", CollegeListAnalysisStatusAPIView.as_view(), name="college-analysis-status"),
    path("engineering-analysis/dashboard/", EngineeringAnalysisDashboardAPIView.as_view(), name="engineering-analysis-dashboard"),
    
    # ======================= Landing Page URL ============================
    
     path("landing-page/", CreateLandingPageAPIView.as_view(), name="create-landing-page"),
     path("landing-page/<int:pk>/", CreateLandingPageAPIView.as_view()),
     path("landing-page/package/<int:package_id>/", LandingPageByPackageAPIView.as_view()),
]
