import json
from django.db import models

# Create your models here.

class Tracks(models.Model):
    track_name = models.CharField(max_length=256)
    track_uuid = models.CharField(max_length=36)
    track_original_path = models.CharField(max_length=256)
    track_date_added = models.DateTimeField(auto_now_add=True)
    
    @property
    def __dict__(self) -> dict:
        return {
            'track_name': self.track_name,
            'track_uuid': self.track_uuid,
            'track_original_path': self.track_original_path,
            'track_date_added': self.track_date_added,
        }
    
PLAYLIST_TYPES = (
    ('USER', 'user'),
    ('SYSTEM', 'system'),
)
class Playlist(models.Model):
    playlist_name = models.CharField(max_length=256)
    tracks = models.ManyToManyField(Tracks)
    playlist_type = models.CharField(max_length=12, choices=PLAYLIST_TYPES, default="USER")
