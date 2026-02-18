from django.urls import path

from counselling_slot.views import AddCounsellorAPIView, BookingCreateAPIView, BookingMarkCompletedAPIView, CounsellorListAPIView, CounsellorSlotByDateAPIView, CreateSlotAPIView, DateWiseSlotListAPIView, LeadCounsellorUserListAPIView, NormalCounsellorUserListAPIView, SessionDashboardCountAPIView, SlotAvailabilityUpdateAPIView, SlotCreateAPIView, SlotDeleteAPIView, UpdateCounsellorStatusAPIView


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
    path("slots/create/", SlotCreateAPIView.as_view(), name="create-slot"),
    path("slots/<str:date>/<int:counsellor>/",SlotCreateAPIView.as_view(), name="counsellor-slots"),
    path("slots/<int:slot_id>/",SlotDeleteAPIView.as_view(), name="delete-slot"),
    path("api/counsellor/status/<int:counsellor>/",UpdateCounsellorStatusAPIView.as_view(),name="update-counsellor-status"),
    path('slots/counsellor-wise/', DateWiseSlotListAPIView.as_view(), name='counsellor-wise-slots'),
    
    path("bookings/create/", BookingCreateAPIView.as_view()),
    path("bookings/<int:booking_id>/", BookingCreateAPIView.as_view()),
    
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
)




]