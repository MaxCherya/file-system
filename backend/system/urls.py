from django.urls import path
from . import views

urlpatterns = [
    # DIRECTORIES
    path("dirs/", views.DirectoryView.as_view()),
    path("dirs/<int:pk>/", views.DirectoryView.as_view()),
    path("all-directories/", views.AllDirectoriesView.as_view()),
    path("dirs-detail/<int:pk>/", views.DirectoryDetailView.as_view()),

    # FILES
    path("files/", views.FileView.as_view()),
    path("files/<int:pk>/", views.FileView.as_view()),

    # TRASH CAN
    path("trash/", views.TrashView.as_view()),
    path("trash/<int:pk>/restore/", views.TrashView.as_view()),
    path("trash/<int:pk>/purge/", views.TrashView.as_view()),

    # SEARCH
    path("search/", views.SearchView.as_view()),

    # PERMISSIONS
    path("perms/<int:pk>/", views.PermissionsView.as_view()),
]
