from django.urls import path

from program_package.views import  ActiveProgramListAPIView, AddProgramAPIView, DashboardCountAPIView, PackageCreateAPIView, PackageListAPIView, ProgramListAPIView, ProgramPackageDetailAPIView, ProgramPackagesAPIView, UpdateProgramAPIView


urlpatterns = [
    path('get-programs/', ProgramListAPIView.as_view(), name='list-programs'),
    path("programs/active/", ActiveProgramListAPIView.as_view(), name="active-programs"),
    path('add-programs/', AddProgramAPIView.as_view(), name='add-program'),
    path('update-program/<int:program_id>/', UpdateProgramAPIView.as_view(), name='update-program'),
    path("programs/<int:program_id>/packages/",ProgramPackagesAPIView.as_view(),name="program-packages"),
    
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
]
