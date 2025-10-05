from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from . models import Node
from . serializers import NodeSerializer
from django.utils import timezone

class DirectoryView(APIView):
    """
        CBV for directory operations
    """

    # endpoint lists children of directory
    # with proper sorting params
    def get(self, request):
        # FILTER PARAMS
        parent_id = request.query_params.get("parent_id")
        sort = request.query_params.get("sort", "name")
        order = request.query_params.get("order", 'desc')

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
        return Response({'ok': True, 'data': ser.data}, status=status.HTTP_200_OK)
    

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
        
        if node_type != Node.NodeTypes.DIRECTORY:
            return Response({'error': 'Only directory creations are allowed here.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if parent_id:
            parent = Node.objects.filter(id=parent_id, is_trashed=False).first()
            if not parent:
                return Response({'error': 'You are trying to upload to the wrong folder.'}, status=status.HTTP_400_BAD_REQUEST)
            if parent.node_type != Node.NodeTypes.DIRECTORY:
                return Response({'error': 'The parent must be a folder'}, status=status.HTTP_400_BAD_REQUEST)
            if not (parent.permissions & Node.Permissions.WRITE):
                return Response({"error": "Permission denied: WRITE on parent."}, status=status.HTTP_403_FORBIDDEN)
            
        if permissions is None:
            permissions = Node.Permissions.READ | Node.Permissions.WRITE | Node.Permissions.DELETE
        try:
            permissions = int(permissions)
        except (TypeError, ValueError):
            return Response({"error": "Incorrect permissions code"}, status=status.HTTP_400_BAD_REQUEST)
        if permissions < 0 or permissions > 15:
            return Response({"error": "Incorrect permissions code"}, status=status.HTTP_400_BAD_REQUEST)

        # DUPLICATE CHECK
        is_duplicate = Node.objects.filter(name=name, node_type=Node.NodeTypes.DIRECTORY, parent_id=(parent.id if parent else None), is_trashed=False).exists()
        if is_duplicate:
            return Response({'error': 'Folder with this name already exists here.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # SERIALIZER AND RESPONSE
        payload = {
            "name": name,
            "node_type": Node.NodeTypes.DIRECTORY,
            "parent": (parent.id if parent else None),
            "permissions": permissions,
            "content": None,
            "size": 0,
        }
        ser = NodeSerializer(data=payload)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response({'ok': True, 'data': ser.data}, status=status.HTTP_201_CREATED)
    

    # change parent
    # or name of specific directory
    def patch(self, request, pk):

        # INITIAL DATA GET
        data = request.data
        name = data.get('name')
        parent_id = data.get('parent_id')

        dir = get_object_or_404(Node, id=pk, is_trashed=False, node_type=Node.NodeTypes.DIRECTORY)

        if not (dir.permissions & Node.Permissions.WRITE):
            return Response({"error": "Permission denied: WRITE on directory."}, status=status.HTTP_403_FORBIDDEN)
        
        # CHECKS
        parent = None
        if parent_id:
            parent = Node.objects.filter(id=parent_id, is_trashed=False, node_type=Node.NodeTypes.DIRECTORY).first()
            if not parent:
                return Response({'error': 'Invalid parent'}, status=status.HTTP_404_NOT_FOUND)
            if not (parent.permissions & Node.Permissions.WRITE):
                return Response({"error": "Permission denied: WRITE on parent."}, status=status.HTTP_403_FORBIDDEN)
            cur = parent
            while cur:
                if cur.id == dir.id:
                    return Response({'error': 'Cannot move a directory into its own subtree.'}, status=status.HTTP_400_BAD_REQUEST)
                cur = cur.parent
            
        if name and not parent_id:
            duplicate = Node.objects.filter(parent_id=(dir.parent.id if dir.parent else None), name=name, node_type=Node.NodeTypes.DIRECTORY, is_trashed=False).exclude(id=dir.id).exists()
            if duplicate:
                return Response({'error': 'The folder with this name already exists'}, status=status.HTTP_409_CONFLICT)
            
        if parent_id is not None or name:
            target_name = name or dir.name
            target_parent_id = parent.id if parent else None
            duplicate = Node.objects.filter(parent_id=target_parent_id, is_trashed=False, node_type=Node.NodeTypes.DIRECTORY, name=target_name).exclude(id=dir.id).exists()
            if duplicate:
                return Response({'error': 'The folder with this name already exists'}, status=status.HTTP_409_CONFLICT)

        # SERIALIZER AND RESPONSE
        payload = {}
        if name is not None:
            payload['name'] = name
        if parent_id is not None:
            payload['parent'] = (parent.id if parent else None)

        if not payload:
            return Response({'ok': True}, status=status.HTTP_200_OK)

        ser = NodeSerializer(instance=dir, data=payload, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response({'ok': True, 'data': ser.data}, status=status.HTTP_200_OK)
    

    # delete specific
    # folder by pk
    def delete(self, request, pk):
        # CHECKS
        if not pk:
            return Response({'error': 'Folder id is required to perform this action'}, status=status.HTTP_400_BAD_REQUEST)
        
        dir = get_object_or_404(Node, id=pk, is_trashed=False, ode_type=Node.NodeTypes.DIRECTORY)

        if not (dir.permissions & Node.Permissions.DELETE):
            return Response({"error": "Permission denied: DELETE"}, status=status.HTTP_403_FORBIDDEN)

        # GATHERING ALL CHILDREN
        # AND ADDITIONAL CHECKS
        ids = [dir.id]
        frontier = [dir.id]
        while frontier:
            children = list(Node.objects.filter(parent_id__in=frontier, is_trashed=False).values_list("id", flat=True))
            if not children:
                break
            ids.extend(children)
            frontier = children

        nodes = Node.objects.filter(id__in=ids)
        unauthorized = [n.name for n in nodes if not (n.permissions & Node.Permissions.DELETE)]

        if unauthorized:
            return Response({"error": "Permission denied to delete some items.", "items": unauthorized}, status=status.HTTP_403_FORBIDDEN)

        # SOFT DELETE ALL AT ONCE AND RESPONSE
        now = timezone.now()
        Node.objects.filter(id__in=ids).update(is_trashed=True, trashed_at=now)

        return Response({"ok": True, "trashed_count": len(ids)}, status=status.HTTP_200_OK)