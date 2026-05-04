# serializers.py

import os

from django.urls import reverse
from rest_framework import serializers

from program_package.models import Package, Program
from .models import Content, ContentPackage

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
    program_details = serializers.SerializerMethodField()
    
    package = serializers.PrimaryKeyRelatedField(
        queryset=Package.objects.all(),
        many=True,
        write_only=True,
        required=False
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
            "package",
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
            # ✅ Public file preview/download route
            representation["file_url"] = request.build_absolute_uri(
                f"/api/content/content-file/{instance.id}/"
            )
            
            # ✅ Show proper uploaded file name
            representation["file_name"] = os.path.basename(instance.file_url.name)


        return representation
        
    def create(self, validated_data):
        programs = validated_data.pop("program", [])
        packages = validated_data.pop("package", [])

        content = Content.objects.create(**validated_data)

        for program in programs:
            for package in packages:
                ContentPackage.objects.create(
                    content=content,
                    program=program,
                    package=package
                )

        return content
    
    def update(self, instance, validated_data):
        programs = validated_data.pop("program", None)
        packages = validated_data.pop("package", None)

        instance = super().update(instance, validated_data)

        if programs is not None or packages is not None:
            ContentPackage.objects.filter(content=instance).delete()

            for program in programs or []:
                for package in packages or []:
                    ContentPackage.objects.create(
                        content=instance,
                        program=program,
                        package=package
                    )

        return instance
        
     # ✅ Show program names in response
    def get_program_names(self, obj):
        return [program.name for program in obj.programs.all()]
    
    # def get_package(self, obj):
    #     packages = Package.objects.filter(program__in=obj.program.all()).distinct()
    #     return [pkg.id for pkg in packages]
    
    def get_program_details(self, obj):
        content_packages = ContentPackage.objects.filter(
            content=obj
        ).select_related("program")

        return [
            {
                "id": cp.program.id,
                "name": cp.program.name
            }
            for cp in content_packages if cp.program
        ]


    def get_package_details(self, obj):
        content_packages = ContentPackage.objects.filter(
            content=obj
        ).select_related("package")

        return [
            {
                "id": cp.package.id,
                "name": cp.package.name,
                "description": cp.package.description
            }
            for cp in content_packages if cp.package
        ]
        
    def validate(self, data):
        content_type = data.get("type")
        file = data.get("file_url") or getattr(self.instance, "file_url", None)
        video_link = data.get("video_link")
        description = data.get("description")

        # Allowed types
        allowed_types = [
            "pdf",
            "excel",
            "xlsx",
            "csv",
            "txt",
            "xls",
            "doc",
            "ppt",
            "zip",
            "image",
            "video",
            "article"
        ]

        # Validate content type
        if content_type not in allowed_types:
            raise serializers.ValidationError({
                "type": f"Invalid type. Allowed types are: {', '.join(allowed_types)}"
            })

        # Prevent both free and paid
        if data.get("free_content") and data.get("payment_required"):
            raise serializers.ValidationError(
                "Content cannot be both free and payment required."
            )

        # VIDEO TYPE
        if content_type == "video":
            if not video_link:
                raise serializers.ValidationError({
                    "video_link": "Video link is required when type is video."
                })

            if file:
                raise serializers.ValidationError({
                    "file_url": "File upload not allowed for Video type."
                })

        # ARTICLE TYPE
        elif content_type == "article":
            if not description:
                raise serializers.ValidationError({
                    "description": "Description required for article type."
                })

        # ALL OTHER FILE TYPES
        else:
            if not file:
                raise serializers.ValidationError({
                    "file_url": "File upload is required."
                })

        return data