import os

def split_env(name: str):
    raw = os.getenv(name, "")
    return [x.strip() for x in raw.split(",") if x.strip()]