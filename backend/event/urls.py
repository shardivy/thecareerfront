from django.urls import path

from event.views import HandHoldingRegisterAPIView

urlpatterns = [
    path('handholding/register/', HandHoldingRegisterAPIView.as_view(), name='handholding-register'),
    
]