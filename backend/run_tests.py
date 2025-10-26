#!/usr/bin/env python
"""Test runner script for API tests"""

import sys
import subprocess


def run_tests(args=None):
    """Run pytest with specified arguments"""
    cmd = ["python", "-m", "pytest"]
    
    # Default args
    default_args = [
        "-v",  # Verbose
        "--tb=short",  # Short traceback
        "--color=yes",  # Color output
    ]
    
    if args:
        cmd.extend(args)
    else:
        cmd.extend(default_args)
        cmd.append("tests/")
    
    print("=" * 70)
    print("🧪 RUNNING API TESTS")
    print("=" * 70)
    print(f"Command: {' '.join(cmd)}\n")
    
    result = subprocess.run(cmd)
    
    print("\n" + "=" * 70)
    if result.returncode == 0:
        print("✅ ALL TESTS PASSED!")
    else:
        print("❌ SOME TESTS FAILED")
    print("=" * 70)
    
    return result.returncode


if __name__ == "__main__":
    sys.exit(run_tests(sys.argv[1:]))

