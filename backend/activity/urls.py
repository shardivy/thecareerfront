from django.urls import path

from activity.views import ActivityLogAPIView



urlpatterns = [
    path('activity-logs/', ActivityLogAPIView.as_view(), name='activity-log-list'),
]