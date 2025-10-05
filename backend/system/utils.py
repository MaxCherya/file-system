from . models import Node

FLAG_MAP = {
    "READ":   Node.Permissions.READ,
    "WRITE":  Node.Permissions.WRITE,
    "DELETE": Node.Permissions.DELETE,
    "ADMIN":  Node.Permissions.ADMIN,
}

def flags_from_bitmask(mask: int) -> list[str]:
    return [name for name, bit in FLAG_MAP.items() if mask & bit]

def to_bits(items):
    bits = 0
    for name in items or []:
        if name not in FLAG_MAP:
            raise ValueError(f"Unknown permission '{name}'. Use READ, WRITE, DELETE, ADMIN.")
        bits |= FLAG_MAP[name]
    return bits