from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from django.db.models import Q

from content.serializers import ContentUploadSerializer
from .models import Content
from django.http import FileResponse
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Sum

from django.db.models import F
import mimetypes


class ContentUploadAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        contents = Content.objects.filter(is_active=True)

        tab = request.GET.get("tab")

        if tab == "study_material":
            contents = contents.filter(category="study_material", is_draft=False)

        elif tab == "tutorial":
            contents = contents.filter(category="tutorial", is_draft=False)

        elif tab == "guide":
            contents = contents.filter(category="guide", is_draft=False)

        elif tab == "draft":
            contents = contents.filter(is_draft=True)

        else:
            # All Content → show everything
            contents = contents

        serializer = ContentUploadSerializer(contents, many=True, context={"request": request})

        return Response({
            "success": True,
            "count": contents.count(),
            "data": serializer.data
        })

    # =========================
    # CREATE CONTENT (POST)
    # =========================
    def post(self, request):
        serializer = ContentUploadSerializer(
            data=request.data,
            context={"request": request},
            partial=True
        )

        if serializer.is_valid():

            required_fields = [
                request.data.get("title"),
                request.data.get("type"),
                request.data.get("category"),
                request.data.get("description"),
            ]

            # ✅ Draft if any field missing
            is_draft_value = not all(required_fields)

            message = (
                "Draft saved successfully"
                if is_draft_value
                else "Content published successfully"
            )

            content = serializer.save(
                created_by=request.user,
                is_draft=is_draft_value
            )

            return Response({
                "success": True,
                "message": message,
                "data": ContentUploadSerializer(
                    content,
                    context={"request": request}
                ).data
            }, status=201)

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=400)
        
    # =========================
    # UPDATE CONTENT (PUT)
    # =========================
    def put(self, request, content_id):
        content = get_object_or_404(Content, id=content_id)

        serializer = ContentUploadSerializer(
            content,
            data=request.data,
            partial=True,
            context={"request": request}
        )

        if serializer.is_valid():
            content = serializer.save()

            return Response({
                "success": True,
                "message": "Content updated successfully",
                "data": ContentUploadSerializer(
                    content,
                    context={"request": request}
                ).data
            })

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=400)
        
    # =========================
    # DELETE CONTENT (Permanent)
    # =========================
    def delete(self, request, content_id):
        content = get_object_or_404(Content, id=content_id)

        # Optional: Only creator can delete
        if content.created_by != request.user:
            return Response({
                "success": False,
                "message": "You do not have permission to delete this content."
            }, status=403)

        content.delete()

        return Response({
            "success": True,
            "message": "Content deleted permanently"
        }, status=200)
    
@method_decorator(xframe_options_exempt, name="dispatch")
class ContentFileView(APIView):
    authentication_classes = []   # remove if JWT needed
    permission_classes = [AllowAny]

    def get(self, request, content_id):
        content = get_object_or_404(Content, id=content_id, is_active=True)

        file = content.file_url.open("rb")

        mime_type, _ = mimetypes.guess_type(content.file_url.path)

        response = FileResponse(file, content_type=mime_type)
        response["Content-Disposition"] = "inline"
        response["X-Frame-Options"] = "ALLOWALL"

        return response
    
    
class ContentDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_content = Content.objects.filter(is_active=True).count()

        free_content = Content.objects.filter(
            is_active=True,
            free_content=True
        ).count()

        premium_content = Content.objects.filter(
            is_active=True,
            payment_required=True
        ).count()
        
         # ✅ Total downloads
        total_download = Content.objects.filter(
            is_active=True
        ).aggregate(total=Sum("download_count"))["total"] or 0

        draft_content = Content.objects.filter(
            is_active=True,
            is_draft=True
        ).count()

        return Response({
            "success": True,
            "data": {
                "total_content": total_content,
                "free_content": free_content,
                "premium_content": premium_content,
                "total_download": total_download,
                "draft_content": draft_content
            }
        })
        
class ContentDownloadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, content_id):
        content = get_object_or_404(Content, id=content_id, is_active=True)

        if not content.file_url:
            return Response({
                "success": False,
                "message": "File not available"
            }, status=404)

        # ✅ Increment download count safely
        Content.objects.filter(id=content.id).update(
            download_count=F('download_count') + 1
        )

        return FileResponse(
            content.file_url.open('rb'),
            as_attachment=True,
            filename=content.file_url.name
        )
        
# class ProgramContentAPIView(APIView):
#     permission_classes = [AllowAny]

#     def get(self, request):

#         program_id = request.GET.get("program_id")
#         package_id = request.GET.get("package_id")

#         contents = Content.objects.filter(is_active=True, is_draft=False)

#         if program_id and package_id:
#             contents = contents.filter(
#                 Q(contentpackage__program_id=program_id,
#                   contentpackage__package_id=package_id)
#                 |
#                 Q(contentpackage__program__isnull=True)
#             )

#         elif program_id:
#             contents = contents.filter(
#                 Q(contentpackage__program_id=program_id,
#                   contentpackage__package__isnull=True)
#                 |
#                 Q(contentpackage__program__isnull=True)
#             )

#         else:
#             contents = contents.filter(
#                 contentpackage__program__isnull=True
#             )

#         contents = contents.distinct()

#         serializer = ContentUploadSerializer(
#             contents,
#             many=True,
#             context={"request": request}
#         )

#         return Response({
#             "success": True,
#             "count": contents.count(),
#             "data": serializer.data
#         })

class ProgramContentAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):

        program_id = request.GET.get("program_id")
        package_id = request.GET.get("package_id")

        contents = Content.objects.filter(is_active=True, is_draft=False)

        if program_id and package_id:
            # Get contents that match BOTH program AND package
            # OR contents with no program (global content)
            contents = contents.filter(
                Q(contentpackage__program_id=program_id,
                  contentpackage__package_id=package_id) |
                Q(contentpackage__isnull=True)  # Contents with no package at all
            )

        elif program_id:
            # Get contents that match the program (with or without package)
            # OR contents with no program (global content)
            contents = contents.filter(
                Q(contentpackage__program_id=program_id) |
                Q(contentpackage__isnull=True)  # Contents with no package at all
            )
            
        elif package_id:
            # Get contents that match the package
            # OR contents with no package (global content)
            contents = contents.filter(
                Q(contentpackage__package_id=package_id) |
                Q(contentpackage__isnull=True)
            )

        # If no filters provided, show all content
        # (removing the restrictive contentpackage__program__isnull=True condition)

        contents = contents.distinct()

        serializer = ContentUploadSerializer(
            contents,
            many=True,
            context={"request": request}
        )

        return Response({
            "success": True,
            "count": contents.count(),
            "data": serializer.data
        })