import os

from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from django.db.models import Q

from lead_registration.models import Stream, StudentProfile, StudentStream
from content.serializers import AssignStreamContentSerializer, ContentListSerializer, ContentUploadSerializer
from .models import Content, ContentPackage, StudentContent
from django.http import FileResponse, Http404
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Sum

from django.db.models import F
import mimetypes


class ContentUploadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, content_id=None):

        # =========================
        # FILE DOWNLOAD MODE
        # =========================
        if content_id:
            content = get_object_or_404(Content, id=content_id)

            if not content.file_url:
                raise Http404("File not found")

            file_path = content.file_url.path

            if not os.path.exists(file_path):
                raise Http404("File does not exist")

            filename = os.path.basename(content.file_url.name)

            # ✅ Terminal log
            print(f"📥 Download Requested:")
            print(f"   Content ID: {content.id}")
            print(f"   Title: {content.title}")
            print(f"   File Name: {filename}")
            print(f"   File Path: {file_path}")

            mime_type, _ = mimetypes.guess_type(file_path)

            response = FileResponse(
                open(file_path, "rb"),
                as_attachment=True,
                filename=filename
            )

            response["Content-Type"] = mime_type or "application/octet-stream"

            return response

        # =========================
        # CONTENT LIST MODE
        # =========================
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

    # =========================
    # CREATE CONTENT (POST)
    # =========================
    def post(self, request):

        uploaded_file = request.FILES.get("file_url")

        # ✅ Terminal log before upload
        if uploaded_file:
            print(f"📤 New Upload Started:")
            print(f"   File Name: {uploaded_file.name}")
            print(f"   File Size: {uploaded_file.size} bytes")
            print(f"   File Type: {uploaded_file.content_type}")

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

            # ✅ Terminal log after upload
            if content.file_url:
                print(f"✅ Upload Completed:")
                print(f"   Content ID: {content.id}")
                print(f"   Stored File Name: {os.path.basename(content.file_url.name)}")
                print(f"   File URL: {content.file_url.url}")

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

        old_file = content.file_url.name if content.file_url else None
        new_file = request.FILES.get("file_url")

        # ✅ Terminal log before update
        print(f"📝 Content Update Started:")
        print(f"   Content ID: {content.id}")
        print(f"   Old File: {old_file if old_file else 'No previous file'}")

        if new_file:
            print(f"   New Uploaded File: {new_file.name}")
            print(f"   New File Size: {new_file.size} bytes")
            print(f"   New File Type: {new_file.content_type}")

        serializer = ContentUploadSerializer(
            content,
            data=request.data,
            partial=True,
            context={"request": request}
        )

        if serializer.is_valid():
            content = serializer.save()

            # ✅ Terminal log after update
            updated_file = content.file_url.name if content.file_url else None

            print(f"✅ Content Update Completed:")
            print(f"   Content ID: {content.id}")
            print(f"   Previous File: {old_file}")
            print(f"   Updated File: {updated_file}")

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
    # DELETE CONTENT
    # =========================
    def delete(self, request, content_id):
        content = get_object_or_404(Content, id=content_id)

        if content.created_by != request.user:
            return Response({
                "success": False,
                "message": "You do not have permission to delete this content."
            }, status=403)

        print(f"🗑️ Content Deleted:")
        print(f"   Content ID: {content.id}")
        print(f"   File: {content.file_url.name if content.file_url else 'No file'}")

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

        if not content.file_url:
            raise Http404("File not found")

        file_path = content.file_url.path

        if not os.path.exists(file_path):
            raise Http404("File does not exist")

        file = open(file_path, "rb")

        mime_type, _ = mimetypes.guess_type(file_path)

        filename = os.path.basename(file_path)

        response = FileResponse(
            file,
            content_type=mime_type or "application/octet-stream",
            # as_attachment=True,   # Force download
            filename=filename
        )
        response["Content-Disposition"] = (
            f'inline; filename="{filename}"'
        )

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
#             # Get contents that match BOTH program AND package
#             # OR contents with no program (global content)
#             contents = contents.filter(
#                 Q(contentpackage__program_id=program_id,
#                   contentpackage__package_id=package_id) |
#                 Q(contentpackage__isnull=True)  # Contents with no package at all
#             )

#         elif program_id:
#             # Get contents that match the program (with or without package)
#             # OR contents with no program (global content)
#             contents = contents.filter(
#                 Q(contentpackage__program_id=program_id) |
#                 Q(contentpackage__isnull=True)  # Contents with no package at all
#             )
            
#         elif package_id:
#             # Get contents that match the package
#             # OR contents with no package (global content)
#             contents = contents.filter(
#                 Q(contentpackage__package_id=package_id) |
#                 Q(contentpackage__isnull=True)
#             )

#         # If no filters provided, show all content
#         # (removing the restrictive contentpackage__program__isnull=True condition)

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

        user = request.user

        # ✅ 🔥 If BASIC USER → show ALL content (free + paid)
        if user.is_authenticated and hasattr(user, "role") and user.role.name.lower() == "basic_user":
            pass  # No filtering, return all content

        else:
            # Apply filters for other users
            if program_id and package_id:
                contents = contents.filter(
                    Q(contentpackage__program_id=program_id,
                      contentpackage__package_id=package_id) |
                    Q(contentpackage__isnull=True)
                )

            elif program_id:
                contents = contents.filter(
                    Q(contentpackage__program_id=program_id) |
                    Q(contentpackage__isnull=True)
                )

            elif package_id:
                contents = contents.filter(
                    Q(contentpackage__package_id=package_id) |
                    Q(contentpackage__isnull=True)
                )

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
        
class ContentByProgramPackageStreamAPIView(APIView):
    permission_classes = [IsAuthenticated]
    """
    Fetch content by Program + Package + Stream
    """

    def get(self, request):

        program_id = request.GET.get("program_id")
        package_id = request.GET.get("package_id")
        stream_ids = request.GET.get("stream_ids")

        if stream_ids:
            stream_ids = [int(i) for i in stream_ids.split(",") if i.strip()]
        else:
            stream_ids = []

        queryset = ContentPackage.objects.select_related(
            "content",
            "program",
            "package",
            "stream"
        ).filter(
            content__is_active=True
        )

        # 👇 Replace only this block
        if program_id:

            queryset = queryset.filter(program_id=program_id)

            if package_id or stream_ids:

                filters = Q(package__isnull=True, stream__isnull=True)

                if package_id:
                    filters |= Q(package_id=package_id)

                if stream_ids:
                    filters |= Q(stream_id__in=stream_ids)

                if package_id and stream_ids:
                    filters |= Q(
                        package_id=package_id,
                        stream_id__in=stream_ids
                    )

                queryset = queryset.filter(filters)
                
                
        content_ids = queryset.values_list(
            "content_id",
            flat=True
        ).distinct()

        contents = Content.objects.filter(
            id__in=content_ids,
            is_active=True
        )

        serializer = ContentListSerializer(
            contents,
            many=True,
            context={"request": request}
        )

        return Response(
            {
                "status": True,
                "count": contents.count(),
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )
        
class AssignStreamAndContentAPIView(APIView):

    def post(self, request):

        serializer = AssignStreamContentSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        student = get_object_or_404(
            StudentProfile,
            id=data["student_id"]
        )

        stream_values = data["stream_id"]

        assigned_streams = []

        # Remove old streams
        StudentStream.objects.filter(
            student_profile=student
        ).delete()

        for stream_value in stream_values:

            # Existing Stream
            if str(stream_value).isdigit():

                stream = get_object_or_404(
                    Stream,
                    id=int(stream_value)
                )

            # New Stream
            else:

                stream, _ = Stream.objects.get_or_create(
                    name=str(stream_value).strip()
                )

            StudentStream.objects.get_or_create(
                student_profile=student,
                stream=stream
            )

            assigned_streams.append({
                "stream_id": stream.id,
                "stream_name": stream.name
            })

        # Save all stream names in StudentProfile
        student.stream = ", ".join(
            [item["stream_name"] for item in assigned_streams]
        )

        student.save(update_fields=["stream"])

        assigned_contents = []

        # Assign contents

        for content_id in data.get("content_ids", []):

            content = get_object_or_404(
                Content,
                id=content_id,
                is_active=True
            )

            StudentContent.objects.get_or_create(
                student_profile=student,
                content=content
            )

            assigned_contents.append({
                "id": content.id,
                "title": content.title
            })

        return Response(
            {
                "status": True,
                "message": "Stream and contents assigned successfully",
                "student_id": student.id,
                "streams": assigned_streams,
                "contents": assigned_contents
            },
            status=status.HTTP_200_OK
        ) 
        
    def put(self, request):

        serializer = AssignStreamContentSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        student = get_object_or_404(
            StudentProfile,
            id=data["student_id"]
        )

        stream_values = data["stream_id"]

        assigned_streams = []

        # Remove old streams
        StudentStream.objects.filter(
            student_profile=student
        ).delete()

        for stream_value in stream_values:

            # Existing Stream
            if str(stream_value).isdigit():

                stream = get_object_or_404(
                    Stream,
                    id=int(stream_value)
                )

            # New Stream
            else:

                stream, _ = Stream.objects.get_or_create(
                    name=str(stream_value).strip()
                )

            StudentStream.objects.get_or_create(
                student_profile=student,
                stream=stream
            )

            assigned_streams.append({
                "stream_id": stream.id,
                "stream_name": stream.name
            })

        student.stream = ", ".join(
            [item["stream_name"] for item in assigned_streams]
        )

        student.save(update_fields=["stream"])

        # Remove old contents
        StudentContent.objects.filter(
            student_profile=student
        ).delete()

        assigned_contents = []

        # Add new contents
        for content_id in data.get("content_ids", []):

            content = get_object_or_404(
                Content,
                id=content_id,
                is_active=True
            )

            StudentContent.objects.create(
                student_profile=student,
                content=content
            )

            assigned_contents.append({
                "id": content.id,
                "title": content.title
            })

        return Response(
            {
                "status": True,
                "message": "Student stream and contents updated successfully",
                "student_id": student.id,
                "stream": stream.name,
                "contents": assigned_contents
            },
            status=status.HTTP_200_OK
        )       
        
# views.py

class StudentAssignedContentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        student = get_object_or_404(
            StudentProfile,
            id=student_id
        )

        contents = Content.objects.filter(
            student_contents__student_profile=student,
            is_active=True
        ).distinct()
        
        student_streams = StudentStream.objects.filter(
            student_profile=student
        ).select_related("stream")

        stream_data = [
            {
                "id": item.stream.id,
                "name": item.stream.name
            }
            for item in student_streams
        ]

        content_data = []

        for content in contents:

            content_data.append({
                "id": content.id,
                "title": content.title,
                "type": content.type,
                "category": content.category,
                "description": content.description,
                "file_url": request.build_absolute_uri(
                    f"/api/content-file/{content.id}/"
                ) if content.file_url else None,
                "file_name": (
                    os.path.basename(content.file_url.name)
                    if content.file_url else None
                )
            })

        return Response({
            "status": True,
            "student_id": student.id,
            "student_name": f"{student.user.first_name} {student.user.last_name}",
            "stream": stream_data,          
            "contents": content_data
        })            
            
            
            