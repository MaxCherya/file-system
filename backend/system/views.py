from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from . models import Node
from . serializers import NodeSerializer

class DirectoryView(APIView):
    """
        CBV for directory operations
    """

    # endpoint lists children of directory
    # with proper sorting params
    def get(self, request):
        # FILTER PARAMS
        parent_id = request.query_params.get(parent_id)
        sort = request.query_params.get(sort, "name")
        order = request.query_params.get(order, 'desc')

        # WHITELISTING USER'S INPUT
        # FOR SECURITY REASONS
        sort_map = {
            "name": "name",
            "size": "size",
            "mtime": "modified_at",
            "type": "node_type",
        }
        sort_field = sort_map.get(sort, "name")
        
        # BUILDING QUERY
        if order == "desc":
            sort_field = f"-{sort_field}"
        qs = Node.objects.filter(is_trashed=False)
        if parent_id is None:
            qs = qs.filter(parent__isnull=True)
        else:
            qs = qs.filter(parent_id=parent_id)

        # OPTIMIZED SMALL PAYLOAD ONLY IMPORTANT FIELDS
        qs = qs.only("id", "name", "node_type", "parent_id", "size", "permissions", "created_at", "modified_at").order_by(sort_field)

        # SERIALIZER AND RESPONSE
        ser = NodeSerializer(qs, many=True)
        return Response({'ok': True, 'result':ser.data}, status=status.HTTP_200_OK)
    

    # endpoint to create
    # a folder
    def post(self, request):
        data = dict(request.data)

        # DATA CHECKS
        name = data.get('name')
        node_type = data.get('node_type')
        parent_id = data.get('parent_id') # optional
        permissions = data.get('permissions') # optional
        
        if not (name and node_type):
            return Response({'error': 'Required data is missing'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not node_type == 'DIRECTORY':
            return Response({'error': 'Only directory creations are allowed here.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if parent_id:
            parent = Node.objects.filter(id=parent_id, is_trashed=False).first()
            if not parent:
                return Response({'error': 'You are trying to upload to the wrong folder.'}, status=status.HTTP_400_BAD_REQUEST)
            if not parent.node_type == 'DIRECTORY':
                return Response({'error': 'The parent must be a folder'}, status=status.HTTP_400_BAD_REQUEST)
            if not (parent.permissions & 2):
                return Response({"error": "Permission denied: WRITE on parent."}, status=status.HTTP_403_FORBIDDEN)
            
        if permissions and permissions > 15 and permissions < 0:
            return Response({'error': 'Incorrect permissions code'}, status=status.HTTP_400_BAD_REQUEST)

        # DUPLICATE CHECK
        is_duplicate = Node.objects.filter(name=data['name'], node_type=data['node_type'], parent=data['parent'], is_trashed=False).exists()
        if is_duplicate:
            return Response({'error': 'File with this name already exists here.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # SERIALIZER AND RESPONSE
        ser = NodeSerializer(data=data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response({'ok': True})