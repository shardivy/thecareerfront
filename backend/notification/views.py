from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework import status

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
                "user_id": n.user.id,
                "is_read": n.is_read
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
        
class SuperAdminNotificationUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, notification_id):

        # 🔒 Allow only superadmin
        # if not request.user.is_superuser:
        #     return Response(
        #         {"message": "Only superadmin can update this notification"},
        #         status=status.HTTP_403_FORBIDDEN
        #     )

        try:
            notification = Notification.objects.get(id=notification_id)
        except Notification.DoesNotExist:
            return Response(
                {"message": "Notification not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        notification.is_read = request.data.get("is_read", True)
        notification.save(update_fields=["is_read"])

        return Response(
            {
                "success": True,
                "message": "Notification updated successfully",
                "data": {
                    "id": notification.id,
                    "is_read": notification.is_read
                }
            },
            status=status.HTTP_200_OK
        )
