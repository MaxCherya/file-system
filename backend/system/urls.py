from django.urls import path
from . import views

urlpatterns = [
    path("dirs/", views.DirectoryView.as_view()),
    path("dirs/<int:pk>/", views.DirectoryView.as_view()),
]
