from django.urls import path
from notification.views import NotificationListAPIView, SuperAdminNotificationAPIView


urlpatterns = [
    path('notifications/', NotificationListAPIView.as_view(), name='notification-list'),
    path('superadmin-notifications/', SuperAdminNotificationAPIView.as_view(), name='superadmin-notification-list'),
]