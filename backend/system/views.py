from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from . models import Node
from . serializers import NodeSerializer
from . utils import flags_from_bitmask, FLAG_MAP, to_bits
from django.utils import timezone
from django.db.models import Q

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

        if parent_id not in (None, "", "0"):
            parent = get_object_or_404(Node, id=parent_id, node_type=Node.NodeTypes.DIRECTORY, is_trashed=False)
            if not (parent.permissions & Node.Permissions.READ):
                return Response({"message": "Permission denied: READ"}, status=status.HTTP_403_FORBIDDEN)
        
        # BUILDING QUERY
        if order == "desc":
            sort_field = f"-{sort_field}"
        qs = Node.objects.filter(is_trashed=False)
        if parent_id in(None, "", "0"):
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
            return Response({'message': 'Required data is missing'}, status=status.HTTP_400_BAD_REQUEST)
        
        if node_type != Node.NodeTypes.DIRECTORY:
            return Response({'message': 'Only directory creations are allowed here.'}, status=status.HTTP_400_BAD_REQUEST)

        parent = None
        if parent_id not in (None, ""):
            parent = Node.objects.filter(id=parent_id, is_trashed=False).first()
            if not parent:
                return Response({'message': 'You are trying to upload to the wrong folder.'}, status=status.HTTP_400_BAD_REQUEST)
            if parent.node_type != Node.NodeTypes.DIRECTORY:
                return Response({'message': 'The parent must be a folder'}, status=status.HTTP_400_BAD_REQUEST)
            if not (parent.permissions & Node.Permissions.WRITE):
                return Response({"message": "Permission denied: WRITE on parent."}, status=status.HTTP_403_FORBIDDEN)
            
        if permissions is None:
            permissions = Node.Permissions.READ | Node.Permissions.WRITE | Node.Permissions.DELETE
        try:
            permissions = int(permissions)
        except (TypeError, ValueError):
            return Response({"message": "Incorrect permissions code"}, status=status.HTTP_400_BAD_REQUEST)
        if permissions < 0 or permissions > 15:
            return Response({"message": "Incorrect permissions code"}, status=status.HTTP_400_BAD_REQUEST)

        # DUPLICATE CHECK
        is_duplicate = Node.objects.filter(name=name, node_type=Node.NodeTypes.DIRECTORY, parent_id=(parent.id if parent else None), is_trashed=False).exists()
        if is_duplicate:
            return Response({'message': 'Folder with this name already exists here.'}, status=status.HTTP_400_BAD_REQUEST)
        
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
            return Response({"message": "Permission denied: WRITE on directory."}, status=status.HTTP_403_FORBIDDEN)
        
        # CHECKS
        parent = None
        if parent_id:
            parent = Node.objects.filter(id=parent_id, is_trashed=False, node_type=Node.NodeTypes.DIRECTORY).first()
            if not parent:
                return Response({'message': 'Invalid parent'}, status=status.HTTP_404_NOT_FOUND)
            if not (parent.permissions & Node.Permissions.WRITE):
                return Response({"message": "Permission denied: WRITE on parent."}, status=status.HTTP_403_FORBIDDEN)
            cur = parent
            while cur:
                if cur.id == dir.id:
                    return Response({'message': 'Cannot move a directory into its own subtree.'}, status=status.HTTP_400_BAD_REQUEST)
                cur = cur.parent
            
        if name and not parent_id:
            duplicate = Node.objects.filter(parent_id=(dir.parent.id if dir.parent else None), name=name, node_type=Node.NodeTypes.DIRECTORY, is_trashed=False).exclude(id=dir.id).exists()
            if duplicate:
                return Response({'message': 'The folder with this name already exists'}, status=status.HTTP_409_CONFLICT)
            
        if parent_id is not None or name:
            target_name = name or dir.name
            target_parent_id = parent.id if parent else None
            duplicate = Node.objects.filter(parent_id=target_parent_id, is_trashed=False, node_type=Node.NodeTypes.DIRECTORY, name=target_name).exclude(id=dir.id).exists()
            if duplicate:
                return Response({'message': 'The folder with this name already exists'}, status=status.HTTP_409_CONFLICT)

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
            return Response({'message': 'Folder id is required to perform this action'}, status=status.HTTP_400_BAD_REQUEST)
        
        dir = get_object_or_404(Node, id=pk, is_trashed=False, ode_type=Node.NodeTypes.DIRECTORY)

        if not (dir.permissions & Node.Permissions.DELETE):
            return Response({"message": "Permission denied: DELETE"}, status=status.HTTP_403_FORBIDDEN)

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
            return Response({"message": "Permission denied to delete some items.", "items": unauthorized}, status=status.HTTP_403_FORBIDDEN)

        # SOFT DELETE ALL AT ONCE AND RESPONSE
        now = timezone.now()
        Node.objects.filter(id__in=ids).update(is_trashed=True, trashed_at=now)

        return Response({"ok": True, "trashed_count": len(ids)}, status=status.HTTP_200_OK)
    


class FileView(APIView):
    """
    CBV for file operations
    """

    # get specific details
    # about specific file by pk
    def get(self, request, pk):
        file = get_object_or_404(Node, id=pk, is_trashed=False, node_type=Node.NodeTypes.FILE)

        if not (file.permissions & Node.Permissions.READ):
            return Response({"message": "Permission denied: READ"}, status=status.HTTP_403_FORBIDDEN)

        return Response({"ok": True, "data": NodeSerializer(file).data}, status=status.HTTP_200_OK)


    # create a file
    # with its permissions, content and parent
    def post(self, request):
        # INITIAL DATA GET
        data = dict(request.data)

        name = (data.get("name") or "")
        parent_id = data.get("parent_id")
        content = data.get("content", "")
        permissions = data.get("permissions")

        # CHECKS
        if not name:
            return Response({"message": "Name is required"}, status=status.HTTP_400_BAD_REQUEST)

        parent = None
        if parent_id not in (None, ""):
            parent = Node.objects.filter(id=parent_id, is_trashed=False).first()
            if not parent:
                return Response({"message": "Parent not found or trashed"}, status=status.HTTP_404_NOT_FOUND)
            if parent.node_type != Node.NodeTypes.DIRECTORY:
                return Response({"message": "Parent must be a directory"}, status=status.HTTP_400_BAD_REQUEST)
            if not (parent.permissions & Node.Permissions.WRITE):
                return Response({"message": "Permission denied: WRITE on parent"}, status=status.HTTP_403_FORBIDDEN)
            
        if permissions is None:
            permissions = Node.Permissions.READ | Node.Permissions.WRITE | Node.Permissions.DELETE
        try:
            permissions = int(permissions)
        except (TypeError, ValueError):
            return Response({"message": "Incorrect permissions code"}, status=status.HTTP_400_BAD_REQUEST)
        if permissions < 0 or permissions > 15:
            return Response({"message": "Incorrect permissions code"}, status=status.HTTP_400_BAD_REQUEST)

        if Node.objects.filter(parent_id=(parent.id if parent else None), name=name, node_type=Node.NodeTypes.FILE, is_trashed=False).exists():
            return Response({"message": "File with this name already exists here."}, status=status.HTTP_409_CONFLICT)

        # PAYLOAD, SERIALIZER AND RESPONSE
        payload = {
            "name": name,
            "node_type": Node.NodeTypes.FILE,
            "parent": (parent.id if parent else None),
            "permissions": permissions,
            "content": content or "",
            "size": len(content or ""),
        }

        ser = NodeSerializer(data=payload)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response({"ok": True, "data": ser.data}, status=status.HTTP_201_CREATED)


    # editing info about
    # file and its location
    def patch(self, request, pk):
        # INITIAL DATA GET
        data = request.data
        name = (data.get("name") or "") or None
        parent_id = data.get("parent_id")  # if none than it moves to the root
        content = data.get("content", None)  # optional

        file = get_object_or_404(Node, id=pk, is_trashed=False, node_type=Node.NodeTypes.FILE)

        # CHECKS
        if not (file.permissions & Node.Permissions.WRITE):
            return Response({"message": "Permission denied: WRITE on file"}, status=status.HTTP_403_FORBIDDEN)

        parent = file.parent
        if parent_id is not None:
            if parent_id in ("", None):
                parent = None
            else:
                parent = Node.objects.filter(id=parent_id, is_trashed=False, node_type=Node.NodeTypes.DIRECTORY).first()
                if not parent:
                    return Response({"message": "Destination parent not found or not a directory"}, status=status.HTTP_404_NOT_FOUND)
                if not (parent.permissions & Node.Permissions.WRITE):
                    return Response({"message": "Permission denied: WRITE on destination directory"}, status=status.HTTP_403_FORBIDDEN)

        if (name is not None) or (parent_id is not None):
            target_name = name or file.name
            target_parent_id = parent.id if parent else None
            dup = Node.objects.filter(parent_id=target_parent_id, name=target_name, node_type=Node.NodeTypes.FILE, is_trashed=False).exclude(id=file.id).exists()
            if dup:
                return Response({"message": "A file with this name already exists in the destination."}, status=status.HTTP_409_CONFLICT)

        # PAYLOAD, SERIALIZER AND RESPONSE
        payload = {}
        if name is not None:
            payload["name"] = name
        if parent_id is not None:
            payload["parent"] = (parent.id if parent else None)
        if content is not None:
            payload["content"] = content
            payload["size"] = len(content or "")

        if not payload:
            return Response({"ok": True, "data": NodeSerializer(file).data}, status=status.HTTP_200_OK)

        ser = NodeSerializer(instance=file, data=payload, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response({"ok": True, "data": ser.data}, status=status.HTTP_200_OK)


    # endpoint to move
    # file into trash
    def delete(self, request, pk):
        file = get_object_or_404(Node, id=pk, is_trashed=False, node_type=Node.NodeTypes.FILE)

        if not (file.permissions & Node.Permissions.DELETE):
            return Response({"message": "Permission denied: DELETE"}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        Node.objects.filter(id=file.id).update(is_trashed=True, trashed_at=now)
        return Response({"ok": True}, status=status.HTTP_200_OK)
    


class TrashView(APIView):
    """
        CBV for Trash Operations
    """

    # get the list of all of the files/folders
    # currently in trash
    def get(self, request):
        # INITIAL DATA GET
        sort = request.query_params.get("sort", "trashed_at")
        order = request.query_params.get("order", "desc")

        # SORT OF PARAMS FOR SECURITY
        sort_map = {
            "trashed_at": "trashed_at",
            "name": "name",
            "type": "node_type",
            "size": "size",
        }
        sort_field = sort_map.get(sort, "trashed_at")

        if order == "desc":
            sort_field = f"-{sort_field}"

        # QUERY AND RESPONSE
        qs = Node.objects.filter(is_trashed=True).only("id", "name", "node_type", "parent_id", "size", "permissions", "created_at", "modified_at", "trashed_at").order_by(sort_field)

        return Response({"ok": True, "data": NodeSerializer(qs, many=True).data}, status=status.HTTP_200_OK)


    # restoring of specific item
    # to the original state or to the new parent
    def post(self, request, pk):
        # INITIAL DATA GET
        node = get_object_or_404(Node, id=pk, is_trashed=True)
        dest_parent_id = request.data.get("parent_id")  # optional, possible to move

        # LOGIC FOR RESTORING PATH
        if dest_parent_id is None:
            dest_parent = node.parent  # restoring back where it was
        elif dest_parent_id in ("", None):
            dest_parent = None  # restore to root
        else:
            dest_parent = Node.objects.filter(id=dest_parent_id, is_trashed=False, node_type=Node.NodeTypes.DIRECTORY).first()
            if not dest_parent:
                return Response({"message": "Destination parent not found or not a directory."}, status=status.HTTP_404_NOT_FOUND)

        # CHECKS OF PERMISSION FOR THE PARENT
        if dest_parent and not (dest_parent.permissions & Node.Permissions.WRITE):
            return Response({"message": "Permission denied: WRITE on destination directory."}, status=status.HTTP_403_FORBIDDEN)

        # DUPLICATE CHECK
        target_parent_id = dest_parent.id if dest_parent else None
        if Node.objects.filter(parent_id=target_parent_id, name=node.name, node_type=node.node_type, is_trashed=False).exclude(id=node.id).exists():
            return Response({"message": "An item with this name already exists at destination."}, status=status.HTTP_409_CONFLICT)

        # RESTORE PROCESS AND LOGIC
        if node.node_type == Node.NodeTypes.FILE:
            node.parent = dest_parent
            node.is_trashed = False
            node.trashed_at = None
            node.save()
        else:
            # FOR DIRECTORIES WE RESOTRE ALSO ALL OF ITS CHILDREN
            node.parent = dest_parent
            node.is_trashed = False
            node.trashed_at = None
            node.save()

            ids = [node.id]
            frontier = [node.id]
            while frontier:
                children = list(Node.objects.filter(parent_id__in=frontier).values_list("id", flat=True))
                if not children:
                    break
                ids.extend(children)
                frontier = children

            Node.objects.filter(id__in=ids, is_trashed=True).update(is_trashed=False, trashed_at=None)

        # RESPONSE
        return Response({"ok": True, "data": NodeSerializer(node).data}, status=status.HTTP_200_OK)


    # endpoint for
    # purge delete of the specific item
    def delete(self, request, pk):
        node = get_object_or_404(Node, id=pk, is_trashed=True)

        if not (node.permissions & Node.Permissions.DELETE):
            return Response({"message": "Permission denied: DELETE on item."}, status=status.HTTP_403_FORBIDDEN)

        # RESPONSE FOR FILE
        if node.node_type == Node.NodeTypes.FILE:
            node.delete()
            return Response({"ok": True}, status=status.HTTP_200_OK)

        # FOR DIRECTORIES WE DELETE ALSO ALL OF ITS CHILDREN
        ids = [node.id]
        frontier = [node.id]
        while frontier:
            children = list(Node.objects.filter(parent_id__in=frontier).values_list("id", flat=True))
            if not children:
                break
            ids.extend(children)
            frontier = children

        alive_exists = Node.objects.filter(id__in=ids, is_trashed=False).exists()
        if alive_exists:
            return Response({"message": "Cannot purge: some descendants are not in trash."}, status=status.HTTP_400_BAD_REQUEST)

        lacking = [n.id for n in Node.objects.filter(id__in=ids) if not (n.permissions & Node.Permissions.DELETE)]
        if lacking.exists():
            return Response({"message": "Permission denied to purge some items."}, status=status.HTTP_403_FORBIDDEN)

        # FINAL FOR DIRECTORY
        Node.objects.filter(id__in=ids).delete()
        return Response({"ok": True, "purged_count": len(ids)}, status=status.HTTP_200_OK)
    


class SearchView(APIView):
    """
        CBV for search of items
    """

    # endpoint search for item
    # by using specific params and respons back
    def get(self, request):
        # PARAMS GET
        q = (request.query_params.get("q") or "").strip()
        scope = (request.query_params.get("in") or "both").lower()
        include_trash = request.query_params.get("include_trash") in ("1", "true", "True")
        node_type = request.query_params.get("type")
        parent_id = request.query_params.get("parent_id")
        try:
            limit = max(1, min(int(request.query_params.get("limit", 100)), 500))
        except ValueError:
            limit = 100

        order = request.query_params.get("order", "name")
        direction = request.query_params.get("direction", "asc")

        # IF NOT PARAMS FOUND RETURNS EMPTY DATA
        if not q:
            return Response({"ok": True, "data": []}, status=status.HTTP_200_OK)

        # BASE QUERYSET
        qs = Node.objects.all()
        if not include_trash:
            qs = qs.filter(is_trashed=False)

        if node_type in (Node.NodeTypes.FILE, Node.NodeTypes.DIRECTORY):
            qs = qs.filter(node_type=node_type)

        if parent_id is not None:
            qs = qs.filter(parent_id=parent_id)

        # SEARCH CONDITION
        name_cond = Q(name__icontains=q)
        content_cond = Q(node_type=Node.NodeTypes.FILE, content__icontains=q)

        if scope == "name":
            qs = qs.filter(name_cond)
        elif scope == "content":
            qs = qs.filter(content_cond)
        else:
            qs = qs.filter(name_cond | content_cond)

        # WHITELISTING
        sort_map = {
            "name": "name",
            "mtime": "modified_at",
            "size": "size",
            "type": "node_type",
        }
        sort_field = sort_map.get(order, "name")
        if direction == "desc":
            sort_field = f"-{sort_field}"

        qs = qs.only("id", "name", "node_type", "parent_id", "size", "permissions", "created_at", "modified_at", "is_trashed").order_by(sort_field)[: limit * 2]

        # PERMISSIONS READ AND FINALLY RESPONSE
        results = []
        for n in qs:
            if n.permissions & Node.Permissions.READ:
                results.append(n)
                if len(results) >= limit:
                    break

        return Response({"ok": True, "data": NodeSerializer(results, many=True).data}, status=status.HTTP_200_OK)
    


class PermissionsView(APIView):
    """
        CBV for permissions
        and all operations related to it
    """


    # get all permissions
    # for specific item by pk
    def get(self, request, pk):
        node = get_object_or_404(Node, id=pk)
        data = {
            "id": node.id,
            "node_type": node.node_type,
            "permissions": node.permissions,
            "flags": flags_from_bitmask(node.permissions)
        }
        return Response({"ok": True, "data": data}, status=status.HTTP_200_OK)


    # edit permissions for
    # specific item by pk
    def patch(self, request, pk):
        node = get_object_or_404(Node, id=pk)

        if not (node.permissions & Node.Permissions.ADMIN):
            return Response({"message": "Permission denied: ADMIN required."}, status=status.HTTP_403_FORBIDDEN)

        # INITIAL DATA GET
        data = request.data or {}
        new_mask = data.get("permissions", None)
        add_flags = data.get("add", None)
        remove_flags = data.get("remove", None)

        if new_mask is None and add_flags is None and remove_flags is None:
            return Response({"message": "Provide 'permissions' bitmask OR 'add'/'remove' flag lists."}, status=status.HTTP_400_BAD_REQUEST)

        mask = node.permissions

        # MASK LOGIC
        if new_mask is not None:
            try:
                new_mask = int(new_mask)
            except (TypeError, ValueError):
                return Response({"message": "permissions must be an integer (0..15)."}, status=status.HTTP_400_BAD_REQUEST)
            if new_mask < 0 or new_mask > 15:
                return Response({"message": "permissions must be in range 0..15."}, status=status.HTTP_400_BAD_REQUEST)
            mask = new_mask

        # MASK CONVERTION REMOVE/ADD FLAGS
        try:
            if add_flags is not None:
                mask |= to_bits(add_flags)
            if remove_flags is not None:
                mask &= ~to_bits(remove_flags)
        except ValueError as e:
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        node.permissions = mask
        node.save(update_fields=["permissions"])

        # PAYLOAD AND RESPONSE
        payload = {
            "id": node.id,
            "permissions": node.permissions,
            "flags": flags_from_bitmask(node.permissions)
        }

        return Response({"ok": True, "data": payload}, status=status.HTTP_200_OK)