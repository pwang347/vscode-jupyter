"""
Note: all executions are function-scoped as we do not assume the code below executes in an isolated kernel environment.
"""


def __DW_DEPENDENCIES__():
    import json
    import importlib
    import subprocess
    import sys

    from builtins import bool, dict, Exception, print

    class SubProcessCommandFailure(Exception):
        pass

    def exec_shell(args):
        """
        Helper to execute shell commands and stream the output.
        Throws SubProcessCommandFailure with the subprocess args if not successful.
        """
        import subprocess
        from builtins import print

        with subprocess.Popen(
            args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT
        ) as process:
            for line in process.stdout or []:
                print(line.decode("utf8"))
            process.communicate()  # wait for the process to complete
            if process.returncode != 0:
                raise SubProcessCommandFailure(str(process.returncode))

    def exec_py_shell(args):
        import sys

        return exec_shell([sys.executable] + args)

    def try_get_module_version(pkg_name):
        """
        Helper to retrieve the version number of a particular package.
        Returns None if the package does not exist or is not installed.
        See https://stackoverflow.com/a/32965521
        """
        try:
            from importlib.metadata import version

            ver = version(pkg_name)
            if ver is not None:
                return ver
        except:
            try:
                import pkg_resources

                dist = pkg_resources.get_distribution(pkg_name)
                if dist is not None and dist.version is not None:
                    return dist.version
            except:
                try:
                    imported_module = importlib.import_module(pkg_name)
                    if (
                        imported_module is not None
                        and imported_module.__version__ is not None
                    ):
                        return imported_module.__version__
                except:
                    pass
        return None

    def get_dependencies(dependency_pkg_map):
        """
        Computes the list of satisfied and unsatisfied dependencies.
        """
        satisfied_deps_map = {}
        missing_deps_map = {}

        for pkg_name, pkg_version in dependency_pkg_map.items():
            installed_ver = try_get_module_version(pkg_name)
            if installed_ver is None:
                missing_deps_map[pkg_name] = {"requiredVersion": pkg_version}
            elif parse_version(installed_ver) < parse_version(pkg_version):
                missing_deps_map[pkg_name] = {
                    "installedVersion": installed_ver,
                    "requiredVersion": pkg_version,
                }
            else:
                satisfied_deps_map[pkg_name] = {
                    "installedVersion": installed_ver,
                    "requiredVersion": pkg_version,
                }

        print(
            json.dumps(
                {"satisfied": satisfied_deps_map, "unsatisfied": missing_deps_map}
            )
        )

    def parse_version(version_str):
        """
        See https://stackoverflow.com/a/21065570
        """
        try:
            from packaging import version

            return version.parse(version_str)
        except:
            from pkg_resources import parse_version

            return parse_version(version_str)

    def is_pyodide_env():
        """
        See https://pyodide.org/en/stable/usage/faq.html#how-to-detect-that-code-is-run-with-pyodide
        """
        import sys

        return "pyodide" in sys.modules

    def is_pip_available():
        # return True if exit code is 0 (success) and False otherwise
        try:
            return not bool(
                subprocess.run(
                    [sys.executable, "-m", "pip"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                ).returncode
            )
        except:
            return False

    def ensure_pip():
        exec_py_shell(["-m", "ensurepip"])

    # all of these Conda helpers are taken from https://github.com/ipython/ipython/blob/main/IPython/core/magics/packaging.py
    def _is_conda_environment():
        from pathlib import Path

        """Return True if the current Python executable is in a conda env"""
        # TODO: does this need to change on windows?
        return Path(sys.prefix, "conda-meta", "history").exists()

    def _get_conda_executable():
        import re
        from pathlib import Path

        """Find the path to the conda executable"""
        # Check if there is a conda executable in the same directory as the Python executable.
        # This is the case within conda's root environment.
        conda = Path(sys.executable).parent / "conda"
        if conda.is_file():
            return str(conda)

        # Otherwise, attempt to extract the executable from conda history.
        # This applies in any conda environment.
        history = Path(sys.prefix, "conda-meta", "history").read_text(encoding="utf-8")
        match = re.search(
            r"^#\s*cmd:\s*(?P<command>.*conda)\s[create|install]",
            history,
            flags=re.MULTILINE,
        )
        if match:
            return match.groupdict()["command"]

        # Fallback: assume conda is available on the system path.
        return "conda"

    def install_dependency(packageName, installer="pip"):
        """
        Installs a dependency
        """
        if installer == "micropip":
            import micropip

            # note: there is no way to update a package - see https://github.com/pyodide/pyodide/issues/3265
            import asyncio  # run the task in sync

            asyncio.run(micropip.install(packageName))
        elif installer == "conda":
            # this will always attempt to update to latest, see https://conda.io/projects/conda/en/latest/commands/install.html
            conda = _get_conda_executable()
            exec_shell([conda, "install", "--yes", "--prefix", sys.prefix, packageName])
        else:
            exec_py_shell(["-m", "pip", "install", packageName, "--upgrade"])

    return dict(
        get_dependencies=get_dependencies,
        is_pip_available=is_pip_available,
        ensure_pip=ensure_pip,
        install_dependency=install_dependency,
        is_conda_env=_is_conda_environment,
        is_pyodide_env=is_pyodide_env,
        parse_version=parse_version,
    )


__DW_DEPENDENCIES__ = __DW_DEPENDENCIES__()
