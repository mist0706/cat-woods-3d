#!/usr/bin/env python3
"""
Clear stale Python cache files that may be causing import errors.
This script removes all .pyc files and __pycache__ directories
from the hermes-agent directory that aren't for the current Python version.
"""

import os
import sys
import shutil
from pathlib import Path

HERMES_AGENT_DIR = Path("/home/mist/.hermes/hermes-agent")
CURRENT_PY_VERSION = f"cpython-{sys.version_info.major}{sys.version_info.minor}"

def clear_stale_caches():
    """Remove stale Python cache files that could cause import issues."""
    total_removed = 0
    
    # Walk through hermes-agent directory
    for root, dirs, files in os.walk(HERMES_AGENT_DIR):
        root_path = Path(root)
        
        # Skip venv directory
        if "venv" in root:
            continue
            
        # Handle __pycache__ directories
        if "__pycache__" in root:
            for f in files:
                if f.endswith('.pyc'):
                    # Check if it's for current Python version
                    if CURRENT_PY_VERSION not in f and 'cpython-3' in f:
                        filepath = root_path / f
                        try:
                            filepath.unlink()
                            total_removed += 1
                            print(f"Removed stale cache: {filepath}")
                        except Exception as e:
                            print(f"Failed to remove {filepath}: {e}")
    
    print(f"\nCleared {total_removed} stale cache files")
    
    # Now verify the import works
    print("\nTesting imports...")
    try:
        from tools.terminal_tool import get_active_env, cleanup_vm, is_persistent_env
        print("✓ All imports successful!")
        print(f"  get_active_env: {get_active_env}")
        print(f"  cleanup_vm: {cleanup_vm}")
        print(f"  is_persistent_env: {is_persistent_env}")
        return True
    except ImportError as e:
        print(f"✗ Import failed: {e}")
        return False

if __name__ == "__main__":
    # Need to be in the right directory with proper sys.path
    sys.path.insert(0, str(HERMES_AGENT_DIR))
    os.chdir(HERMES_AGENT_DIR)
    
    success = clear_stale_caches()
    sys.exit(0 if success else 1)
