# serializers.py

from django.urls import reverse
from rest_framework import serializers

from program_package.models import Package, Program
from .models import Content

class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = ["id", "name"]


class ContentUploadSerializer(serializers.ModelSerializer):
    # file_url = serializers.SerializerMethodField()

    # ✅ Accept program IDs while creating/updating
    program = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all(),
        many=True,
        write_only=True
    )

    # ✅ Return full program objects in GET
    program_details = ProgramSerializer(
        source="program",
        many=True,
        read_only=True
    )
    
    # package = serializers.SerializerMethodField()
    package_details = serializers.SerializerMethodField()

    class Meta:
        model = Content
        fields = [
            "id",
            "title",
            "type",
            "category",
            "description",
            "program",           # write
            "program_details",   # read
            # "package",
            "package_details",
            "file_url",      # ✅ REAL upload field
            # "preview_url",   # ✅ URL for viewing
            "video_link",
            "image",
            "download_count",
            "free_content",
            "payment_required",
            "is_draft",
        ]
    # ✅ Override representation to show preview URL instead of file path
    def to_representation(self, instance):
        representation = super().to_representation(instance)

        request = self.context.get("request")

        if instance.file_url and request:
            representation["file_url"] = request.build_absolute_uri(
                reverse("content-file-view", args=[instance.id])
            )

        return representation
    
     # ✅ Show program names in response
    def get_program_names(self, obj):
        return [program.name for program in obj.programs.all()]
    
    # def get_package(self, obj):
    #     packages = Package.objects.filter(program__in=obj.program.all()).distinct()
    #     return [pkg.id for pkg in packages]


    def get_package_details(self, obj):
        packages = Package.objects.filter(program__in=obj.program.all()).distinct()

        return [
            {
                "id": pkg.id,
                "name": pkg.name,
                "description": pkg.description
            }
            for pkg in packages
        ]
        
    def validate(self, data):
        content_type = data.get("type")
        file = data.get("file_url") or getattr(self.instance, "file_url", None)
        video_link = data.get("video_link")
        description = data.get("description")

        if data.get("free_content") and data.get("payment_required"):
            raise serializers.ValidationError(
                "Content cannot be both free and payment required."
            )

        if content_type == "pdf":
            if not file:
                raise serializers.ValidationError(
                    {"file_url": "PDF file is required when type is pdf."}
                )
            if video_link:
                raise serializers.ValidationError(
                    {"video_link": "Video link not allowed for PDF type."}
                )

        if content_type == "video":
            if not video_link:
                raise serializers.ValidationError(
                    {"video_link": "Video link is required when type is video."}
                )
            if file:
                raise serializers.ValidationError(
                    {"file_url": "File upload not allowed for Video type."}
                )

        if content_type == "article":
            if not description:
                raise serializers.ValidationError(
                    {"description": "Description required for article type."}
                )

        return data