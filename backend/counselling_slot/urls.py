from django.urls import path

from counselling_slot.views import AddCounsellorAPIView, AllCounsellorListAPIView, AllCounsellorStudentBookingListAPIView, BookingCreateAPIView, BookingMarkCompletedAPIView, CancelBookingAPIView, CounsellingNoteCreateView, CounsellingNoteFileDeleteView, CounsellingNoteFileView, CounsellorCompletedStudentBookingListAPIView, CounsellorDashboardCountAPIView, CounsellorListAPIView, CounsellorMonthAPIView, CounsellorSlotByDateAPIView, CounsellorStudentBookingListAPIView, CreateSlotAPIView, DateWiseSlotListAPIView, LeadCounsellorUserListAPIView, NormalCounsellorUserListAPIView, ReenaCounsellorAPIView, SendReminderAPIView, SessionDashboardCountAPIView, SlotAvailabilityUpdateAPIView, SlotCreateAPIView, SlotDeleteAPIView, StudentBookingListAPIView, StudentCounsellingNoteAPIView, UpdateCounsellorStatusAPIView


urlpatterns = [
    path('lead-counsellors/', LeadCounsellorUserListAPIView.as_view()),
    path('normal-counsellors/', NormalCounsellorUserListAPIView.as_view()),
    
    # ==================== Add new counsellor =====================
    path("add-counsellor/", AddCounsellorAPIView.as_view(), name="add-counsellor"),
    path("counsellors/<int:id>/", AddCounsellorAPIView.as_view(), name="update-counsellor"),
    
    # ===================== To create slots ======================
    path("slots/", CreateSlotAPIView.as_view(), name="create-slot"),
    path("slots/<int:pk>/", CreateSlotAPIView.as_view(), name="update-slot"),
    
    #  path("booking/", BookingCreateAPIView.as_view(), name="book-slot"),
     path("booking/<int:booking_id>/", BookingCreateAPIView.as_view()),
     
     
     
     
     
     
    # ==================== New Updates Below ======================================================    
    
    path("counsellors/", CounsellorListAPIView.as_view(), name="counsellor-list"),
    path("counsellors/all/", AllCounsellorListAPIView.as_view(), name="all-counsellor-list"),
    path(
    "reena-bhutada-counsellor/",
    ReenaCounsellorAPIView.as_view(),
    name="reena-bhutada-counsellor"
),
    path("slots/create/", SlotCreateAPIView.as_view(), name="create-slot"),
    path("slots/<str:date>/<int:counsellor>/",SlotCreateAPIView.as_view(), name="counsellor-slots"),
    path("slots/<int:slot_id>/",SlotDeleteAPIView.as_view(), name="delete-slot"),
    path("counsellor/status/<int:counsellor>/",UpdateCounsellorStatusAPIView.as_view(),name="update-counsellor-status"),
    path('slots/counsellor-wise/', DateWiseSlotListAPIView.as_view(), name='counsellor-wise-slots'),
    
    path("bookings/create/", BookingCreateAPIView.as_view()),
    path("bookings/<int:booking_id>/", BookingCreateAPIView.as_view()),
    
    path(
    "bookings/<int:booking_id>/cancel/",
    CancelBookingAPIView.as_view(),
    name="cancel-booking"
),
    
    path(
    "session-count/",
    SessionDashboardCountAPIView.as_view(),
    name="session-dashboard-count"
),
    
     path(
        "counsellor-slots/<str:date>/",
        CounsellorSlotByDateAPIView.as_view(),
        name="counsellor-slots-by-date"
    ),
     path("slots/<int:slot_id>/availability/", 
     SlotAvailabilityUpdateAPIView.as_view(), 
     name="update-slot-availability"),
     
    path(
    "bookings/<int:booking_id>/mark-completed/",
    BookingMarkCompletedAPIView.as_view(),
    name="booking-mark-completed"
),
    path("student/<int:student_id>/bookings/", StudentBookingListAPIView.as_view(), name="student-bookings"),
    
    path(
    "counsellor/my-students/",
    CounsellorStudentBookingListAPIView.as_view(),
    name="counsellor-my-students",
),
    path(
    "counsellor/completed-bookings/",
    CounsellorCompletedStudentBookingListAPIView.as_view(),
    name="counsellor-completed-bookings"
),
    # path(
    #     "counsellor/dashbord-all/",
    #     DashboardCounsellorCompletedStudentBookingListAPIView.as_view(),
    #     name="counsellor-dashboard-all"
    # ),
    path(
        "counsellor-bookings/",
        AllCounsellorStudentBookingListAPIView.as_view(),
        name="counsellor-bookings-list"
    ),
    path("counselling-note/create/<int:booking_id>/", CounsellingNoteCreateView.as_view()),
    path(
        "student-counselling-notes/<int:student_id>/",
        StudentCounsellingNoteAPIView.as_view(),
        name="student-counselling-notes",
    ),
    path(
    "booking/<int:booking_id>/notes/<int:note_id>/",
    CounsellingNoteCreateView.as_view(),
),
    path(
    "counselling-note/<int:booking_id>/<int:note_id>/delete-file/<str:file_field>/",
    CounsellingNoteFileDeleteView.as_view(),
    name="counselling-note-file-delete",
),
    path(
        "counselling-note/file/<int:note_id>/<int:file_index>/",
        CounsellingNoteFileView.as_view(),
        name="counselling-note-file-view",
    ),
    path(
        "counsellor/dashboard-count/",
        CounsellorDashboardCountAPIView.as_view(),
        name="counsellor-dashboard-count"
    ),
    path('counsellor-bookings-all-list/', CounsellorMonthAPIView.as_view(), name='counsellor-bookings'),
    
    path(
        "send-reminder/<int:booking_id>/",
        SendReminderAPIView.as_view(),
        name="send-reminder"
    ),




]