from rest_framework import serializers
from activity.models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):

    user_email = serializers.CharField(source="user.email", default=None)

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "user_email",
            "action",
            "module",
            "model_name",
            "object_id",
            "description",
            "created_at"
        ]