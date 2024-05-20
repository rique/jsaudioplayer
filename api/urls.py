from django.urls import path

from . import views

urlpatterns = [
    path("file-browser", views.fileBrowser, name="filebrowser"),
    path("add-track", views.addTrack, name="addtrack"),
    path("load-track-list", views.loadTrackList, name="loadtracklist"),
    path("load-bg-img", views.loadBGImages, name="loadbgimages"),
    path("scan-for-my-tracks", views.scanForMyTracks, name="scanformytracks"),
    path("delete-track", views.deleteTrack, name="deleteTrack"),
    path("create-playlist", views.createPLaylist, name="createPLaylist"),
    path("edit-track", views.editTrack, name="editTrack"),
    path("add-track-to-playlist", views.addTrackToPLaylist, name="addTrackToPLaylist"),
]

