from rest_framework import serializers
from .models import Node

class NodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Node
        fields = [ "id", "name", "node_type", "parent", "size", "permissions", "created_at", 
                  "modified_at", "is_trashed", "trashed_at", "content" ]
        read_only_fields = ["id", "size", "created_at", "modified_at", "trashed_at"]