# @dw/orchestrator

This library provides an implementation for the data wrangler orchestrator, which manages the wrangling session state and overall workflow. We've endearingly named this module as the "orchestrator" as it tends to be the source of truth for session information, is the entrypoint for wrangling extensibility and coordinates with the other modules.

Engine implementations have explicit dependencies on this package for the interfaces, and therefore also must be versioned appropriately if there are any breaking changes.
