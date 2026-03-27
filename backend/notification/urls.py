from django.urls import path
from notification.views import NotificationListAPIView, SuperAdminNotificationAPIView, SuperAdminNotificationUpdateAPIView


urlpatterns = [
    path('notifications/', NotificationListAPIView.as_view(), name='notification-list'),
    path('superadmin-notifications/', SuperAdminNotificationAPIView.as_view(), name='superadmin-notification-list'),
    path(
        "superadmin/notifications/<int:notification_id>/",
        SuperAdminNotificationUpdateAPIView.as_view(),
        name="superadmin-notification-update",
    ),
]