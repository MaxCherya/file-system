from django.db import models

class Node(models.Model):

    class NodeTypes(models.TextChoices):
        FILE = "FILE", "File"
        DIRECTORY = "DIRECTORY", "Directory"

    """
    To be able to select multiple values
    here included the calculation to give
    for each permission its own binary code.

    Basically very right 0 or 1 is boolean for READ
    and very left for admin. If we have 1111 it means
    we have all permissions, if 0000 none.

    The permission field contains plain number and to check
    the option we check its binary value.
    """
    class Permissions(models.IntegerChoices):
        READ   = 1 << 0 # 0001
        WRITE  = 1 << 1 # 0010
        DELETE = 1 << 2 # 0100
        ADMIN  = 1 << 3 # 1000

    name = models.CharField(max_length=255)
    node_type = models.CharField(max_length=10, choices=NodeTypes)
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.CASCADE, related_name='children')
    content = models.TextField(blank=True, null=True)
    permissions = models.IntegerField(default=Permissions.READ | Permissions.WRITE | Permissions.DELETE)
    size = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    is_trashed = models.BooleanField(default=False)
    trashed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.node_type})"