from django.urls import path

from counselling_slot.views import AddCounsellorAPIView, BookingCreateAPIView, CreateSlotAPIView, LeadCounsellorUserListAPIView, NormalCounsellorUserListAPIView


urlpatterns = [
    path('lead-counsellors/', LeadCounsellorUserListAPIView.as_view()),
    path('normal-counsellors/', NormalCounsellorUserListAPIView.as_view()),
    
    # ==================== Add new counsellor =====================
    path("add-counsellor/", AddCounsellorAPIView.as_view(), name="add-counsellor"),
    path("counsellors/<int:id>/", AddCounsellorAPIView.as_view(), name="update-counsellor"),
    
    # ===================== To create slots ======================
    path("slots/", CreateSlotAPIView.as_view(), name="create-slot"),
    path("slots/<int:pk>/", CreateSlotAPIView.as_view(), name="update-slot"),
    
     path("booking/", BookingCreateAPIView.as_view(), name="book-slot"),
     path("booking/<int:booking_id>/", BookingCreateAPIView.as_view()),

]