from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response

from activity.models import ActivityLog
from activity.serializers import ActivityLogSerializer

class ActivityLogAPIView(APIView):

    def get(self, request):

        logs = ActivityLog.objects.select_related("user").only(
            "id",
            "action",
            "module",
            "model_name",
            "object_id",
            "description",
            "created_at",
            "user__email"
        ).exclude(
            module="token_blacklist"
        ).order_by("-created_at")[:50]  # latest 50

        serializer = ActivityLogSerializer(logs, many=True)

        return Response({
            "message": "Recent activity fetched",
            "data": serializer.data
        })
