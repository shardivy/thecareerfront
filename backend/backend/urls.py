from django.contrib import admin
from django.urls import include, path

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/lead-registeration/', include('lead_registration.urls')),
    path('api/program-package/', include('program_package.urls')),
    path("api/exam/", include("exam.urls")),
    path('api/payment/', include('payment.urls')),
    path('api/counselling_slot/', include('counselling_slot.urls')),
    path('api/report/', include('report.urls')),
    path('api/content/', include('content.urls')),
    path('api/notification/', include('notification.urls')),
    path('api/activity/', include('activity.urls')),
    path('api/event/', include('event.urls')),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
