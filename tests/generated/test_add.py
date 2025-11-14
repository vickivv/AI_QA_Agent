def add(a,b): return a+b

import pytest

# Define the function to be tested
def add(a, b):
    return a + b

# Begin with a Python statement (e.g., import pytest)
def test_add():
    # Test if 1 + 2 equals 3
    assert add(1, 2) == 3
