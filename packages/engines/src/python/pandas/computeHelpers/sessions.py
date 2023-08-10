"""
Note: all executions are function-scoped as we do not assume the code below executes in an isolated kernel environment.
"""


def __DW_SESSIONS__():
    import uuid
    import builtins
    import os

    def create_session():
        session_id = builtins.str(uuid.uuid4())
        return session_id

    def get_relative_path(path):
        return os.path.relpath(path)

    return builtins.dict(
        create_session=create_session, get_relative_path=get_relative_path
    )


__DW_SESSIONS__ = __DW_SESSIONS__()
