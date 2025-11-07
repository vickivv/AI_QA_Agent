def add(a,b):
    return a+b

import pytest

def test_add():
    assert add(1,2) == 3   # Positive case: simple integers
    assert add(-1,-2) == -3   # Edge case: Negative numbers
    assert add(0,0) == 0     # Edge case: Zero inputs
    assert add(999999,1) == 1000000  # Edge case: Large integers
