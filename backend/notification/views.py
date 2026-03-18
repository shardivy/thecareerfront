from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model

from notification.models import Notification

class NotificationListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        notifications = Notification.objects.filter(
            user=request.user
        ).order_by("-created_at")

        data = [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "created_at": n.created_at
            }
            for n in notifications
        ]

        return Response(data)
    
User = get_user_model()
    
class SuperAdminNotificationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # 🔒 Allow only superadmin
        if not request.user.is_superuser:
            return Response(
                {"message": "Only superadmin can access this API"},
                status=403
            )

        # 🔹 Get all notifications for superadmin(s)
        notifications = Notification.objects.filter(
            user__is_superuser=True
        ).order_by("-created_at")

        data = [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "created_at": n.created_at,
                "user_id": n.user.id
            }
            for n in notifications
        ]

        return Response(
            {
                "success": True,
                "count": notifications.count(),
                "data": data
            }
        )
