from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/lead-registeration/', include('lead_registration.urls')),
    path('api/program-package/', include('program_package.urls')),
    path("api/exam/", include("exam.urls")),
    path('api/payment/', include('payment.urls')),
    path('api/counselling_slot/', include('counselling_slot.urls')),
    

]
